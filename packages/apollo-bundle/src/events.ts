import { ApolloServer } from "apollo-server-express";
import { Event } from "@bluelibs/core";
import * as express from "express";
import * as http from "http";

export interface IApolloServerInitialisation {
  server?: ApolloServer; // ApolloServer Express
  httpServer?: http.Server; // HTTP Server from Node
  app?: express.Application; // express() app
}

export class ApolloServerBeforeInitEvent extends Event<
  IApolloServerInitialisation
> {}

/**
 * This executes after the server has started listening
 */
export class ApolloServerAfterInitEvent extends Event<
  IApolloServerInitialisation
> {}

export interface IWebSocketOnDisconnectEventData {
  webSocket: any;
  context: any;
}

export interface IWebSocketOnConnectEventData
  extends IWebSocketOnDisconnectEventData {
  connectionParams: any;
}

/**
 * When connection to GraphQL websocket is established
 */
export class WebSocketOnConnectEvent extends Event<
  IWebSocketOnConnectEventData
> {}

/**
 * When connection to GraphQL websocket is dropped
 */
export class WebSocketOnDisconnectEvent extends Event<
  IWebSocketOnDisconnectEventData
> {}
