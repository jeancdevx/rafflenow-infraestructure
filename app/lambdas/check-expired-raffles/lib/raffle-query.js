import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { logger } from "./powertools.js";

export async function queryExpiredRaffles(docClient, targetDate) {
  logger.info("Querying expired raffles", {
    target_date: targetDate,
    index: "StatusEndDateIndex",
  });

  const queryParams = {
    TableName: process.env.DYNAMODB_RAFFLES_TABLE,
    IndexName: "StatusEndDateIndex",
    KeyConditionExpression: "#status = :active AND #endDate <= :targetDate",
    ExpressionAttributeNames: {
      "#status": "status",
      "#endDate": "end_date",
    },
    ExpressionAttributeValues: {
      ":active": "active",
      ":targetDate": targetDate,
    },
  };

  const queryResult = await docClient.send(new QueryCommand(queryParams));
  return queryResult.Items || [];
}
