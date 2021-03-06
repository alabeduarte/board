import Rx from 'rxjs';
import OrbitDB from 'orbit-db';
import uuid from 'uuid/v4';

const ACCESS_TO_EVERYONE = '*';

export default async (hash, node) => {
  const orbitdb = new OrbitDB(node);

  const access = {
    write: [ACCESS_TO_EVERYONE],
  };

  const db = await orbitdb.docs(hash, access);

  const all = async () => {
    await db.load();
    return db.query(doc => doc);
  };

  const posts = new Rx.BehaviorSubject();
  posts.next(await all());

  db.events.on('replicated', async () => {
    posts.next(await all());
  });

  const add = async post => {
    const _id = post._id || uuid();
    const data = await db.put({ ...post, ...{ _id } });
    posts.next(await all());
    return data;
  };

  return {
    posts,
    add,
  };
};
