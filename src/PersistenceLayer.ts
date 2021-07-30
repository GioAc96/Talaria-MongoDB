import {Entity, EntityEventsListener} from "talaria";
import {Collection} from 'mongodb'

export class PersistenceLayer<E extends Entity<E>> implements EntityEventsListener<E>{

    private readonly collection: Collection

    constructor(
        mongoDBCollection: Collection
    ) {

        this.collection = mongoDBCollection

    }

    _notifyOfCreation(createdEntity: E): void {

        const document = createdEntity.$queryObject({})

        console.log(document)

        document._id = document.id
        delete document.id

        this.collection.insertOne(document).then()

    }

    _notifyPostUpdate(updatedEntity: E): void {

        const document = updatedEntity.$queryObject(true)

        const id = document.id
        delete document.id

        this.collection.updateOne(
            {_id: id},
            document
        ).then()

    }

    _notifyPreDeletion(deletedEntity: E): void {

        this.collection.deleteOne({_id: deletedEntity.id}).then()

    }

    _notifyPreUpdate(updatedEntity: E): void {
    }

}