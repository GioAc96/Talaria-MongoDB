import { MongoMemoryServer } from 'mongodb-memory-server'
import {MongoClient} from "mongodb";

let mongoClient: undefined | MongoClient = undefined
let mongoServer: undefined | MongoMemoryServer = undefined

export async function initDBServer(): Promise<MongoMemoryServer> {

    if (mongoServer === undefined) {

        mongoServer = await MongoMemoryServer.create()

    }

    return mongoServer

}

export async function initDBClient(): Promise<MongoClient> {

    if (mongoServer === undefined) {

        await initDBServer()

    }

    if (mongoClient === undefined) {

        mongoClient = new MongoClient((mongoServer as MongoMemoryServer).getUri())

    }

    return mongoClient

}

export async function killDb(): Promise<void> {

    if (mongoClient !== undefined) {

        await mongoClient.close()

    }

    if (mongoServer !== undefined) {

        await mongoServer.stop()

    }

}
