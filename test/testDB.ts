import {MongoMemoryServer} from 'mongodb-memory-server'
import {Db, MongoClient} from "mongodb";

const dbName = ''
let mongoClient: undefined | MongoClient = undefined
let mongoServer: undefined | MongoMemoryServer = undefined
let mongoDB: undefined | Db = undefined

export async function initDBServer(): Promise<MongoMemoryServer> {

    if (mongoServer === undefined) {

        mongoServer = await MongoMemoryServer.create()

    }

    return mongoServer

}

export async function initDBClient(): Promise<MongoClient> {


    await initDBServer()

    if (mongoClient === undefined) {

        mongoClient = new MongoClient((mongoServer as MongoMemoryServer).getUri())
        await mongoClient.connect()

    }

    return mongoClient

}

export async function initDB(): Promise<Db> {

    await initDBClient()

    if (mongoDB === undefined) {

        mongoDB = (mongoClient as MongoClient).db(dbName)

    }

    if (mongoDB === undefined) {

        throw new Error("Could not connect to db. Check db name")

    }

    return mongoDB

}

export async function killDb(): Promise<void> {

    if (mongoDB !== undefined) {

        await mongoDB.dropDatabase()
        mongoDB = undefined

    }

    if (mongoClient !== undefined) {

        await mongoClient.close()
        mongoClient = undefined

    }

    if (mongoServer !== undefined) {

        await mongoServer.stop()
        mongoServer = undefined

    }

}