import {Collection, ObjectId} from "mongodb";
import {EntitySerializer, Identifiable, Repository} from 'talaria'

export class RepositoryFiller<D extends Identifiable> {

    readonly serializer: EntitySerializer<D>
    readonly collection: Collection

    constructor(serializer: EntitySerializer<D>, collection: Collection) {

        this.serializer = serializer
        this.collection = collection

    }

    private static documentToSerializedEntity(document: any): unknown {

        document.id = (document._id as ObjectId).toHexString()
        delete document._id

        return document

    }

    async fillRepository(repository: Repository<D>) {

        await this.collection.find({}).forEach(document => {

            const serializedEntity = RepositoryFiller.documentToSerializedEntity(document)

            const entityData: D = this.serializer.deserialize(serializedEntity)

            const id = entityData.id
            const dataDraft = (({id, ...other}) => other)(entityData)

            repository.createEntityWithId(
                dataDraft,
                id
            )

        })

    }

}
