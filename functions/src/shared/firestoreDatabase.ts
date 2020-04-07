import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp(functions.config().firebase);

export class FirestoreDatabase<T>{
    private readonly db = admin.firestore();
    private collectionRef: admin.firestore.CollectionReference;

    /**
     *
     * @param collectionName Name of the firebase collection that is being referred to (must be created)
     */
    constructor(collectionName: string) {
        this.collectionRef = this.db.collection(collectionName);
    }


    /**
     * Retrieve a document by using reference (id)
     * 
     * @param ref The reference of the document
     * @return the promise of the data for the reference document or undefined if not found
     */
    public async get(ref: string): Promise<T | void> {
        const res = await this.collectionRef.doc(ref).get();
        if (!res.exists) return undefined;
        return res.data() as T;
    }

    /**
     * Retrieve a document by using query
     * 
     * @param queryField The attribute that is being queried
     * @param queryString The actual query string
     * @return the promise of the data for the first document found with the query or undefined if nothing is found
     */
    public async getBy(queryField: string, queryString: string): Promise<T | void> {
        const queryRef = this.collectionRef.where(queryField, '==', 'queryString');
        const res = await queryRef.get();
        if (res.empty) return undefined;
        // Just Return the first one        
        return res.docs[0].data() as T;
    }

    /**
     * Create a doucment
     * 
     * @param ref The reference of the document being created
     * @param data The data of the document being created
     */
    public async create(ref: string, data: T): Promise<void> {
        const newRef = this.collectionRef.doc(ref);
        await this.runTransaction('create', newRef, data);
    }

    /**
     * Add a field to a document
     *
     * @param ref The reference of the document being updated
     * @param fieldKey The key of the field that is being added
     * @param fieldData The data of the document being added
     */
    public async addField(ref: string, fieldKey: string, fieldData: any): Promise<void> {
        const updateRef = this.collectionRef.doc(ref);
        await this.runTransaction('set', updateRef, fieldData, fieldKey);
    }

    /**
     * Update a document
     *
     * @param ref The reference of the document being updated
     * @param fieldKey The key of the field that is being updated
     * @param fieldData The data of the document being updated
     */
    public async update(ref: string, fieldKey: string, fieldData: any): Promise<void> {
        const updateRef = this.collectionRef.doc(ref);
        await this.runTransaction('update', updateRef, fieldData, fieldKey);
    }

    // Firestore doesn't support undefined type so do a check before 
    private async runTransaction(type: 'create' | 'set' | 'update', ref: admin.firestore.DocumentReference, obj: any, key?: string): Promise<void> {
        Object.entries(obj).forEach(([k, v]) => {
            if (!v) {
                delete obj[k];
            }
        });
        if (Object.keys.length === 0) return;
        const updateObject: any = {};
        if (key) {
            updateObject[key] = obj;
        }
        await this.db.runTransaction(t => {
            switch (type) {
                case 'create': {
                    t.create(ref, obj);
                    break;
                }

                case 'set': {
                    t.set(ref, updateObject, { merge: true });
                }

                case 'update': {
                    t.update(ref, updateObject);
                }
            }
            return Promise.resolve('Write Complete');
        });
    }
}