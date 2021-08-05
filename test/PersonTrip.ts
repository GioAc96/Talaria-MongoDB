import {
    EntitySerializer,
    Id,
    Identifiable,
    InMemoryRepository,
    ManyToManyRelationship,
    OneToManyRelationship,
    OneToOneRelationship,
    SerializationCodec,
    ToManyEntities,
    ToManyEntitiesPointerCodec,
    ToOneEntity,
    ToOneEntityPointerCodec
} from 'talaria'
import {ObjectId} from "mongodb";
import * as t from "io-ts";

export type Person = Identifiable & {

    name: string
    age?: number
    favouriteColor?: "red" | "blue" | "green"
    readonly bestFriend: OnePerson
    readonly friends: ManyPeople
    readonly attendedTrips: ManyTrips
    readonly organizedTrips: ManyTrips

}

export class OnePerson extends ToOneEntity<Person> {
    constructor(id?: Id) {
        super(PersonRepository, id);
    }
}

export class ManyPeople extends ToManyEntities<Person> {
    constructor(ids: Id[] = []) {
        super(PersonRepository, ids);
    }
}

export let PersonRepository = new InMemoryRepository<Person>(
    () => new ObjectId().toHexString()
)

export type Trip = Identifiable & {

    location: string
    readonly participants: ManyPeople
    readonly organizer: OnePerson
}

export let TripRepository = new InMemoryRepository<Trip>(() => new ObjectId().toHexString())

export class OneTrip extends ToOneEntity<Trip> {
    constructor(id?: Id) {
        super(TripRepository, id);
    }
}

export class ManyTrips extends ToManyEntities<Trip> {
    constructor(ids: Id[] = []) {
        super(TripRepository, ids);
    }
}

export const BestFriendship = new OneToOneRelationship<Person, Person>({
    e1ToE2: "bestFriend",
    e2ToE1: "bestFriend"
})
export const Friendship = new ManyToManyRelationship<Person, Person>({
    e1ToE2s: "friends",
    e2ToE1s: "friends"
})

export const TripOrganization = new OneToManyRelationship<Person, Trip>({
    e1ToE2s: "organizedTrips",
    e2ToE1: "organizer"
})
export const TripAttendance = new ManyToManyRelationship<Person, Trip>({
    e1ToE2s: "attendedTrips",
    e2ToE1s: "participants"
})

export let PersonCodec: SerializationCodec<Person> = t.recursion('Person', () =>
    t.intersection([
        t.type({
            id: t.string,
            name: t.string,
            bestFriend: ToOneEntityPointerCodec(PersonCodec, PersonRepository),
            friends: ToManyEntitiesPointerCodec(PersonCodec, PersonRepository),
            attendedTrips: ToManyEntitiesPointerCodec(TripCodec, TripRepository),
            organizedTrips: ToManyEntitiesPointerCodec(TripCodec, TripRepository)
        }),
        t.partial({
            favouriteColor: t.union([t.literal('green'), t.literal('red'), t.literal('blue')]),
            age: t.number
        })
    ])
)

export let TripCodec: SerializationCodec<Trip> = t.recursion('Trip', () =>

    t.type({
        id: t.string,
        location: t.string,
        participants: ToManyEntitiesPointerCodec(PersonCodec, PersonRepository),
        organizer: ToOneEntityPointerCodec(PersonCodec, PersonRepository)
    })
)

export let PersonSerializer = new EntitySerializer(PersonCodec)
export let TripSerializer = new EntitySerializer(TripCodec)

export function reInitRepos() {

    PersonRepository = new InMemoryRepository<Person>(PersonRepository.idGenerator)
    TripRepository = new InMemoryRepository<Trip>(TripRepository.idGenerator)

    PersonCodec = t.recursion('Person', () =>
        t.intersection([
            t.type({
                id: t.string,
                name: t.string,
                bestFriend: ToOneEntityPointerCodec(PersonCodec, PersonRepository),
                friends: ToManyEntitiesPointerCodec(PersonCodec, PersonRepository),
                attendedTrips: ToManyEntitiesPointerCodec(TripCodec, TripRepository),
                organizedTrips: ToManyEntitiesPointerCodec(TripCodec, TripRepository)
            }),
            t.partial({
                favouriteColor: t.union([t.literal('green'), t.literal('red'), t.literal('blue')]),
                age: t.number
            })
        ])
    )

    TripCodec = t.recursion('Trip', () =>

        t.type({
            id: t.string,
            location: t.string,
            participants: ToManyEntitiesPointerCodec(PersonCodec, PersonRepository),
            organizer: ToOneEntityPointerCodec(PersonCodec, PersonRepository)
        })
    )

    PersonSerializer = new EntitySerializer(PersonCodec)
    TripSerializer = new EntitySerializer(TripCodec)

}

