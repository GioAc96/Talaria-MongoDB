import {initDB, killDb} from "./testDB";
import {
    BestFriendship,
    Friendship,
    ManyPeople,
    ManyTrips,
    OnePerson,
    PersonRepository,
    PersonSerializer,
    reInitRepos,
    TripOrganization,
    TripRepository,
    TripSerializer
} from "./PersonTrip";
import {Collection, ObjectId} from "mongodb";
import {PersistenceLayer} from "../src";
import {RepositoryFiller} from "../src/RepositoryFiller";

let PeopleCollection: Collection
let TripsCollection: Collection

async function sleep(ms: number = 10): Promise<void> {

    return new Promise(resolve => setTimeout(resolve, ms));

}

beforeAll(async () => {

    const db = await initDB()

    PeopleCollection = await db.createCollection('people')

    //const client = new MongoClient('mongodb://localhost')
    //await client.connect()
//
    //PeopleCollection = client.db('test').collection('people')
    //TripsCollection = client.db('test').collection('trips')

    TripsCollection = await db.createCollection('trips')

})

afterAll(async (): Promise<void> => {
    await killDb();
});

afterEach(async (): Promise<void> => {

    await PeopleCollection.deleteMany({})
    await TripsCollection.deleteMany({})

    reInitRepos()

})

test("Create entity propagates to persistence layer", async () => {

    PersonRepository.registerListener(
        new PersistenceLayer(PeopleCollection, PersonSerializer)
    )

    const giorgio = PersonRepository.createEntity({
        name: 'giorgio',
        bestFriend: new OnePerson(),
        friends: new ManyPeople(),
        organizedTrips: new ManyTrips(),
        attendedTrips: new ManyTrips()
    })

    await sleep()

    expect(await PeopleCollection.countDocuments()).toEqual(1)

    expect(await PeopleCollection.findOne({_id: new ObjectId(giorgio.id)})).toEqual({
        _id: new ObjectId(giorgio.id),
        name: 'giorgio',
        bestFriend: null,
        friends: [],
        organizedTrips: [],
        attendedTrips: []
    })

})

test("Update entity propagates to persistence layer", async () => {

    PersonRepository.registerListener(
        new PersistenceLayer(PeopleCollection, PersonSerializer)
    )

    const giorgio = PersonRepository.createEntity({
        name: 'giorgio',
        bestFriend: new OnePerson(),
        friends: new ManyPeople(),
        organizedTrips: new ManyTrips(),
        attendedTrips: new ManyTrips()
    })

    giorgio.update({
        name: 'Giorgio Acquati'
    })

    await sleep()

    expect((await PeopleCollection.findOne({_id: new ObjectId(giorgio.id)}))?.name).toEqual('Giorgio Acquati')

})

test("Delete entity propagates to persistence layer", async () => {

    PersonRepository.registerListener(
        new PersistenceLayer(PeopleCollection, PersonSerializer)
    )

    const giorgio = PersonRepository.createEntity({
        name: 'giorgio',
        bestFriend: new OnePerson(),
        friends: new ManyPeople(),
        organizedTrips: new ManyTrips(),
        attendedTrips: new ManyTrips()
    })

    giorgio.delete()

    await sleep()

    expect(await PeopleCollection.countDocuments()).toEqual(0)

})

test('OneToOneRelationship update propagates to persistence layer', async () => {

    PersonRepository.registerListener(
        new PersistenceLayer(PeopleCollection, PersonSerializer)
    )

    const giorgio = PersonRepository.createEntity({
        name: 'giorgio',
        bestFriend: new OnePerson(),
        friends: new ManyPeople(),
        organizedTrips: new ManyTrips(),
        attendedTrips: new ManyTrips()
    })

    const bubu = PersonRepository.createEntity({
        name: 'bubu',
        bestFriend: new OnePerson(),
        friends: new ManyPeople(),
        organizedTrips: new ManyTrips(),
        attendedTrips: new ManyTrips()
    })

    await sleep()

    expect((await PeopleCollection.findOne({
        _id: new ObjectId(giorgio.id)
    }))?.bestFriend).toEqual(null)

    expect((await PeopleCollection.findOne({
        _id: new ObjectId(bubu.id)
    }))?.bestFriend).toEqual(null)

    BestFriendship.set(giorgio, bubu)

    await sleep()

    expect((await PeopleCollection.findOne({
        _id: new ObjectId(giorgio.id)
    }))?.bestFriend).toEqual(bubu.id)

    expect((await PeopleCollection.findOne({
        _id: new ObjectId(bubu.id)
    }))?.bestFriend).toEqual(giorgio.id)

})

test('ManyToMany update propagates to persistence layer', async () => {

    PersonRepository.registerListener(
        new PersistenceLayer(PeopleCollection, PersonSerializer)
    )

    const giorgio = PersonRepository.createEntity({
        name: 'giorgio',
        bestFriend: new OnePerson(),
        friends: new ManyPeople(),
        organizedTrips: new ManyTrips(),
        attendedTrips: new ManyTrips()
    })

    const bubu = PersonRepository.createEntity({
        name: 'bubu',
        bestFriend: new OnePerson(),
        friends: new ManyPeople(),
        organizedTrips: new ManyTrips(),
        attendedTrips: new ManyTrips()
    })

    await sleep()

    expect((await PeopleCollection.findOne({
        _id: new ObjectId(giorgio.id)
    }))?.friends).toEqual([])

    expect((await PeopleCollection.findOne({
        _id: new ObjectId(bubu.id)
    }))?.friends).toEqual([])

    Friendship.add(giorgio, bubu)

    await sleep()

    expect((await PeopleCollection.findOne({
        _id: new ObjectId(giorgio.id)
    }))?.friends).toEqual([bubu.id])

    expect((await PeopleCollection.findOne({
        _id: new ObjectId(bubu.id)
    }))?.friends).toEqual([giorgio.id])

})

test('OneToMany update propagates to persistence layer', async () => {

    PersonRepository.registerListener(
        new PersistenceLayer(PeopleCollection, PersonSerializer)
    )
    TripRepository.registerListener(
        new PersistenceLayer(TripsCollection, TripSerializer)
    )

    const giorgio = PersonRepository.createEntity({
        name: 'giorgio',
        bestFriend: new OnePerson(),
        friends: new ManyPeople(),
        organizedTrips: new ManyTrips(),
        attendedTrips: new ManyTrips()
    })

    const monterosso = TripRepository.createEntity({
        location: 'monterosso',
        participants: new ManyPeople(),
        organizer: new OnePerson()
    })

    await sleep()

    expect((await PeopleCollection.findOne({
        _id: new ObjectId(giorgio.id)
    }))?.organizedTrips).toEqual([])

    expect((await TripsCollection.findOne({
        _id: new ObjectId(monterosso.id)
    }))?.organizer).toEqual(null)

    TripOrganization.add(giorgio, monterosso)

    await sleep()

    expect((await PeopleCollection.findOne({
        _id: new ObjectId(giorgio.id)
    }))?.organizedTrips).toEqual([monterosso.id])

    expect((await TripsCollection.findOne({
        _id: new ObjectId(monterosso.id)
    }))?.organizer).toEqual(giorgio.id)

})

test("empty collection returns empty repository", async () => {

    const filler = new RepositoryFiller(
        PersonSerializer,
        PeopleCollection
    )

    await filler.fillRepository(PersonRepository)

    expect(PersonRepository.getAllEntities()).toEqual([])

})

test("collection with invalid items can not deserialize", async () => {

    await PeopleCollection.insertOne({
        name: 1,
        bestFriend: null,
        attendedTrips: [],
        organizedTrips: [],
        friends: []
    })

    try {

        const filler = new RepositoryFiller(
            PersonSerializer,
            PeopleCollection
        )

        await filler.fillRepository(PersonRepository)


        fail()

    } catch (e) {

    }

})

test('Collection with one entity correctly populates repository', async () => {

    await PeopleCollection.insertOne({
        name: 'giorgio',
        bestFriend: null,
        friends: [],
        organizedTrips: [],
        attendedTrips: []
    })

    const filler = new RepositoryFiller(
        PersonSerializer,
        PeopleCollection
    )

    await filler.fillRepository(PersonRepository)

    expect(PersonRepository.getAllEntities().length).toEqual(1)

    const giorgio = PersonRepository.getAllEntities()[0].data

    expect(giorgio.name).toEqual('giorgio')
    expect(giorgio.friends.getAllIds()).toEqual([])
    expect(giorgio.bestFriend.getId()).toEqual(undefined)
    expect(giorgio.attendedTrips.getAllIds()).toEqual([])
    expect(giorgio.organizedTrips.getAllIds()).toEqual([])

})

test('Multiple collections and relationships correctly populate repositories', async () => {

    const giorgioId = new ObjectId()
    const bubuId = new ObjectId()
    const boezioId = new ObjectId()

    const monterossoId = new ObjectId()
    const krkId = new ObjectId()

    await PeopleCollection.insertOne({
        _id: giorgioId,
        name: 'giorgio',
        bestFriend: bubuId.toHexString(),
        friends: [boezioId.toHexString(), bubuId.toHexString()],
        organizedTrips: [monterossoId.toHexString()],
        attendedTrips: [monterossoId.toHexString(), krkId.toHexString()]
    })
    await PeopleCollection.insertOne({
        _id: bubuId,
        name: 'bubu',
        bestFriend: giorgioId.toHexString(),
        friends: [giorgioId.toHexString(), boezioId.toHexString()],
        organizedTrips: [krkId.toHexString()],
        attendedTrips: [monterossoId.toHexString(), krkId.toHexString()]
    })
    await PeopleCollection.insertOne({
        _id: boezioId,
        name: 'boezio',
        bestFriend: null,
        friends: [giorgioId.toHexString(), bubuId.toHexString()],
        organizedTrips: [],
        attendedTrips: []
    })

    await TripsCollection.insertOne({
        _id: monterossoId,
        location: 'monterosso',
        organizer: giorgioId.toHexString(),
        participants: [giorgioId.toHexString(), bubuId.toHexString()]
    })

    await TripsCollection.insertOne({
        _id: krkId,
        location: 'krk',
        organizer: bubuId.toHexString(),
        participants: [giorgioId.toHexString(), bubuId.toHexString()]
    })


    const PersonRepositoryFiller = new RepositoryFiller(
        PersonSerializer,
        PeopleCollection
    )

    await PersonRepositoryFiller.fillRepository(PersonRepository)


    const TripRepositoryFiller = new RepositoryFiller(
        TripSerializer,
        TripsCollection
    )

    await TripRepositoryFiller.fillRepository(TripRepository)


    expect(PersonRepository.getAllEntities().length).toEqual(3)
    expect(TripRepository.getAllEntities().length).toEqual(2)

    const giorgio = PersonRepository.getEntityById(giorgioId.toHexString())

    expect(giorgio).not.toEqual(undefined)

    expect(giorgio?.data.name).toEqual('giorgio')
    expect(giorgio?.data.bestFriend.getId()).toEqual(bubuId.toHexString())
    expect(giorgio?.data.bestFriend.getEntity()?.data.name).toEqual('bubu')
    expect(giorgio?.data.organizedTrips.getAllIds()).toEqual([monterossoId.toHexString()])
    expect(giorgio?.data.friends.getAllEntities().map(friend => friend?.data.name)).toEqual(['boezio', 'bubu'])
    expect(giorgio?.data.attendedTrips.getAllEntities().map(trip => trip?.data.location)).toEqual(['monterosso', 'krk'])

    const bubu = PersonRepository.getEntityById(bubuId.toHexString())

    expect(bubu).not.toEqual(undefined)

    expect(bubu?.data.name).toEqual('bubu')
    expect(bubu?.data.bestFriend.getId()).toEqual(giorgioId.toHexString())
    expect(bubu?.data.bestFriend.getEntity()?.data.name).toEqual('giorgio')
    expect(bubu?.data.organizedTrips.getAllIds()).toEqual([krkId.toHexString()])
    expect(bubu?.data.friends.getAllEntities().map(friend => friend?.data.name)).toEqual(['giorgio', 'boezio'])
    expect(bubu?.data.attendedTrips.getAllEntities().map(trip => trip?.data.location)).toEqual(['monterosso', 'krk'])

    const boezio = PersonRepository.getEntityById(boezioId.toHexString())

    expect(boezio).not.toEqual(undefined)

    expect(boezio?.data.name).toEqual('boezio')
    expect(boezio?.data.bestFriend.getId()).toEqual(undefined)
    expect(boezio?.data.organizedTrips.getAllIds()).toEqual([])
    expect(boezio?.data.friends.getAllEntities().map(friend => friend?.data.name)).toEqual(['giorgio', 'bubu'])
    expect(boezio?.data.attendedTrips.getAllEntities().map(trip => trip?.data.location)).toEqual([])

})
