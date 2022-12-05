#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ProductsAppStack } from '../lib/productsApp-stack';
import { ECommerceApiStack } from '../lib/ecommerceApi-stack';
import { ProducstAppLayersStack } from '../lib/productsAppLayers-stack'
import { EventsDdbStack } from '../lib/eventsDdb-stack';
import { OrdersAppLayersStack } from '../lib/ordersAppLayers-stack'
import { OrdersAppStack } from '../lib/ordersApp-stack'

const app = new cdk.App();

const env: cdk.Environment = {
  account: "132363692469",
  region: "us-east-1"
}

const tags = {
  cost: "ECommerce",
  team: "SiecolaCode"
}

const producstAppLayersStack = new ProducstAppLayersStack(app,"ProductsAppLayers",{
  tags,
  env
})

const eventsDdbStack = new EventsDdbStack(app,"EventsDdb", {
  tags,
  env
})

const productsAppStack = new ProductsAppStack(app, "ProductsApp", {
  eventsDdb: eventsDdbStack.table,
  tags,
  env
})

productsAppStack.addDependency(producstAppLayersStack)
productsAppStack.addDependency(eventsDdbStack)

const ordersAppLayersStack = new OrdersAppLayersStack(app, "OrdersAppLayers", {
  tags,
  env
}) 

const ordersAppStack = new OrdersAppStack(app,"OrdersApp", {
  tags,
  env,
  productsDdb: productsAppStack.productsDdb
})

ordersAppStack.addDependency(productsAppStack)
ordersAppStack.addDependency(ordersAppLayersStack)

const eCommerceApiStack = new ECommerceApiStack(app, "ECommerceApi", {
  productsFetchHandler: productsAppStack.productsFetchHandler,
  productsAdminHandler: productsAppStack.productsAdminHandler,
  ordersHandler: ordersAppStack.ordersHandler,
  tags,
  env
})

eCommerceApiStack.addDependency(productsAppStack)
eCommerceApiStack.addDependency(ordersAppStack)