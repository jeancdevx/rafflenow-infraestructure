$Profile = "jeancdev"
$TerraformDir = "$PSScriptRoot\..\iac\environments\dev"

Write-Host "=== Creando usuarios de prueba en Cognito ===" -ForegroundColor Green
Write-Host "Obteniendo configuración desde Terraform..." -ForegroundColor Cyan

Push-Location $TerraformDir
$UserPoolId = terraform output -json infrastructure | ConvertFrom-Json | Select-Object -ExpandProperty cognito | Select-Object -ExpandProperty user_pool_id
$ClientId = terraform output -json infrastructure | ConvertFrom-Json | Select-Object -ExpandProperty cognito | Select-Object -ExpandProperty client_id
Pop-Location

if (-not $UserPoolId -or -not $ClientId) {
    Write-Host "❌ Error: No se pudieron obtener los valores de Terraform" -ForegroundColor Red
    exit 1
}

Write-Host "User Pool ID: $UserPoolId" -ForegroundColor Gray
Write-Host "Client ID: $ClientId" -ForegroundColor Gray
Write-Host "AWS Profile: $Profile" -ForegroundColor Gray
Write-Host ""

# Admin User
Write-Host "`nCreando usuario Admin..." -ForegroundColor Yellow
aws cognito-idp admin-create-user `
  --user-pool-id $UserPoolId `
  --username admin@rafflenow.com `
  --user-attributes Name=email,Value=admin@rafflenow.com Name=email_verified,Value=true `
  --temporary-password "TempAdmin123!" `
  --message-action SUPPRESS `
  --profile $Profile 2>$null

if ($LASTEXITCODE -eq 0) {
    aws cognito-idp admin-add-user-to-group `
      --user-pool-id $UserPoolId `
      --username admin@rafflenow.com `
      --group-name Admin `
      --profile $Profile

    aws cognito-idp admin-set-user-password `
      --user-pool-id $UserPoolId `
      --username admin@rafflenow.com `
      --password "AdminPass123!" `
      --permanent `
      --profile $Profile

    Write-Host "✓ Usuario Admin creado: admin@rafflenow.com / AdminPass123!" -ForegroundColor Green
} else {
    Write-Host "⚠ Usuario Admin ya existe o error en creación" -ForegroundColor Yellow
}

# Regular User
Write-Host "`nCreando usuario regular..." -ForegroundColor Yellow
aws cognito-idp admin-create-user `
  --user-pool-id $UserPoolId `
  --username user@rafflenow.com `
  --user-attributes Name=email,Value=user@rafflenow.com Name=email_verified,Value=true `
  --temporary-password "TempUser123!" `
  --message-action SUPPRESS `
  --profile $Profile 2>$null

if ($LASTEXITCODE -eq 0) {
    aws cognito-idp admin-add-user-to-group `
      --user-pool-id $UserPoolId `
      --username user@rafflenow.com `
      --group-name User `
      --profile $Profile

    aws cognito-idp admin-set-user-password `
      --user-pool-id $UserPoolId `
      --username user@rafflenow.com `
      --password "UserPass123!" `
      --permanent `
      --profile $Profile

    Write-Host "✓ Usuario regular creado: user@rafflenow.com / UserPass123!" -ForegroundColor Green
} else {
    Write-Host "⚠ Usuario regular ya existe o error en creación" -ForegroundColor Yellow
}

Write-Host "`n=== Proceso completado ===" -ForegroundColor Green
Write-Host "`nCredenciales para Insomnia:" -ForegroundColor Cyan
Write-Host "  Admin: admin@rafflenow.com / AdminPass123!"
Write-Host "  User:  user@rafflenow.com / UserPass123!"
Write-Host "`nCognito Configuration:" -ForegroundColor Gray
Write-Host "  User Pool ID: $UserPoolId" -ForegroundColor Gray
Write-Host "  Client ID: $ClientId" -ForegroundColor Gray
