import * as cdk from '@aws-cdk/core';
import * as sns from '@aws-cdk/aws-sns';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as lambda from '@aws-cdk/aws-lambda';
import * as cognito from '@aws-cdk/aws-cognito';

const pinpoint =  require("@aws-cdk/aws-pinpoint");


export class AStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    //cognito
    const idp = new cognito.CfnIdentityPool(this, "voting-cognito", {
      //allow access to unauthenticated identities
      allowUnauthenticatedIdentities: true
    });
    //this is needed by the web UI
    var identity_pool_id = idp.openIdConnectProviderArns;

    //dynamo tables
    const VotesTable = new dynamodb.Table(this, 'VoteApp', {
      partitionKey: { 
        name: 'id', 
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1,
      encryption: dynamodb.TableEncryption.AWS_MANAGED
    });
  

    const AggregatesTable = new dynamodb.Table(this, 'AggregatesTable', {
      partitionKey: { 
        name: 'id', 
        type: dynamodb.AttributeType.STRING 
      },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1,
      encryption: dynamodb.TableEncryption.AWS_MANAGED
    });

    
    //sample lambda - feel free to delete
    const handler = new lambda.Function(this, "WidgetHandler", {
      runtime: lambda.Runtime.NODEJS_10_X, // So we can use async in widget.js
      code: lambda.Code.asset("resources"),
      handler: "widgets.main"
    });

    //security for DDB
    AggregatesTable.grantReadWriteData(handler);
    VotesTable.grantReadWriteData(handler);

    //Pinpoint Project
    const pinpointProject = new pinpoint.CfnApp(this, "vote4cdk", {
      name: "vote4cdk"
    });

    //Pipoint SNS topic
    const topic = new sns.Topic(this, 'Topic', {
      displayName: 'Pinpoint Incomming subscription topic'
    });

  }
}