import {Entity, EntityEvent, EntityEventsListener, Identifiable, EntitySerializer} from 'talaria'
import {Collection, ObjectId} from "mongodb";

type Task = () => Promise<void>

export class PersistenceLayer<D extends Identifiable> implements EntityEventsListener<D> {

    readonly collection: Collection
    private static readonly tasks: Task[] = []
    private readonly serializer

    constructor(collection: Collection, serializer: EntitySerializer<D>) {

        this.collection = collection
        this.serializer = serializer

    }

    private static async runTasks() {

        while (PersistenceLayer.tasks.length > 0) {

            await (PersistenceLayer.tasks.shift() as Task)()

        }

    }

    private static pushTask(task: Task): void {

        PersistenceLayer.tasks.push(task)

        if (PersistenceLayer.tasks.length === 1) {

            this.runTasks()

        }

    }

    private entityToDocument(entity: Entity<D>): any {

        const document: any = this.serializer.serialize(entity)

        document._id = document.id
        delete document.id

        return document

    }

    private entityObjectId(entity: Entity<D>): ObjectId {

        return new ObjectId(entity.id)

    }

    private entityCreated(entity: Entity<D>): void {

        const document = this.entityToDocument(entity)

        PersistenceLayer.pushTask(async () => {
            await this.collection.insertOne(document)
        })

    }

    _notifyOfEntityEvent(entity: Entity<D>, event: EntityEvent): void {

        switch (event) {

            case EntityEvent.CREATED:
                this.entityCreated(entity)
                break

            case EntityEvent.POST_UPDATE:
                this.entityUpdated(entity)
                break

            case EntityEvent.PRE_DELETE:
                this.entityDeleted(entity)
                break

        }

    }

    private entityUpdated(entity: Entity<D>): void {

        const document = this.entityToDocument(entity)
        const id = this.entityObjectId(entity)

        PersistenceLayer.pushTask(async () => {

            await this.collection.updateOne({_id: id}, document)

        })

    }

    private entityDeleted(entity: Entity<D>): void {

        const id = this.entityObjectId(entity)

        PersistenceLayer.pushTask(async () => {

            await this.collection.deleteOne({_id: id})

        })

    }
}
