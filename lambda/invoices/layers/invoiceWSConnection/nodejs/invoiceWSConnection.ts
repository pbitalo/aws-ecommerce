import { ApiGatewayManagementApi } from "aws-sdk";

export class InvoiceWSService {
    private apiwManagementeApi: ApiGatewayManagementApi

    constructor(apiwManagementeApi:ApiGatewayManagementApi) {
        this.apiwManagementeApi = apiwManagementeApi
    }

    sendInvoiceStatus(transactionId: string, connectionId: string, status: string) {
        const postData = JSON.stringify({
            transactionId,
            status
        })
        return this.sendData(connectionId, postData)
    }

    async disconnectClient(connectionId: string): Promise<boolean> {
        try {
            await this.apiwManagementeApi.getConnection({
                ConnectionId: connectionId
            }).promise()

            this.apiwManagementeApi.deleteConnection({
                ConnectionId: connectionId
            }).promise()

            return true
        } catch (err) {
            console.error(err)
            return false
        }        
    }

    async sendData(connectionId: string, data: string): Promise<boolean> {
        try {
            await this.apiwManagementeApi.getConnection({
                ConnectionId: connectionId
            }).promise()

            await this.apiwManagementeApi.postToConnection({
                ConnectionId: connectionId,
                Data: data
            }).promise()

            return true
        } catch (err) {
            console.error(err)
            return false
        }
    }
}