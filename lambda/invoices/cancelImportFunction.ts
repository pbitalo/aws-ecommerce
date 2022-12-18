import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda"
import { ApiGatewayManagementApi, DynamoDB } from "aws-sdk"
import * as AWSRay from "aws-xray-sdk"
import { promises } from "dns"
import { InvoiceTransactionRepository, InvoiceTransactionStatus } from "/opt/nodejs/invoiceTransaction"
import { InvoiceWSService } from "/opt/nodejs/invoiceWSConnection"

AWSRay.captureAWS(require('aws-sdk'))

const invoicesDdb = process.env.INVOICE_DDB!
const invoicesWsApiEndpoint = process.env.INVOICE_WSAPI_ENDPOINT!.substring(6) // Vai gerar url no formato // wss://<endereço WS API>, por isso precisamos retirar wss://

const ddbClient = new DynamoDB.DocumentClient()
const apigwManagementApi = new ApiGatewayManagementApi({
    endpoint: invoicesWsApiEndpoint
})

const invoiceTransactionRepository = new InvoiceTransactionRepository(ddbClient, invoicesDdb)
const invoiceWSService = new InvoiceWSService(apigwManagementApi)

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    
    const transactionId = JSON.parse(event.body!).transactionId as string
    const lambdaRequestId = context.awsRequestId
    const connectionId = event.requestContext.connectionId!

    console.log(`ConnectionId: ${connectionId} - lambda Request Id: ${lambdaRequestId}`)

    try {
        const invoiceTransaction = await invoiceTransactionRepository.getInvoiceTransaction(transactionId)
        if (invoiceTransaction.transactionStatus === InvoiceTransactionStatus.GENERATED) {

            await Promise.all([
                invoiceWSService.sendInvoiceStatus(transactionId, connectionId, InvoiceTransactionStatus.CANCELLED),
                invoiceTransactionRepository.updateInvoiceTransaction(transactionId, InvoiceTransactionStatus.CANCELLED)
            ])
            
        } else {
            await invoiceWSService.sendInvoiceStatus(transactionId, connectionId, invoiceTransaction.transactionStatus)            
            console.error(`Can't cancel an ongoing process`)
        }
    } catch(error) {
        console.error((<Error>error).message)
        console.error(`Invoice transaction not found - TransactionId: ${transactionId}`)
        await invoiceWSService.sendInvoiceStatus(transactionId, connectionId, InvoiceTransactionStatus.NOT_FOUND)
    }

    await invoiceWSService.disconnectClient(connectionId)
    return {
        statusCode: 200,
        body: "OK"
    }
}