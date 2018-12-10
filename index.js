const { ApolloServer, PubSub } = require('apollo-server')
const { MongoClient, ObjectID } = require('mongodb')
const lifts = require('./data/lifts.json')
const trails = require('./data/trails.json')

require('dotenv').config();

/**
 * TODO LIST:
 * Create a mutation to add a lift/trail
 * Modify the allLifts to filter by trail status
 * Add an allTrails query
 * Add an allTrailsAndLifts query by status
 * Add a liftCount query
 * Add findTrailByName query
 */

const typeDefs = `
  enum Status {
    OPEN
    CLOSED
    HOLD
  }
  type Lift {
    id: ID!
    name:String!
    capacity: Int!
    status: Status!
    night: Boolean
    elevationGain: Int
    trailAccess: [Trail!]!
  }
  type Trail {
    id: ID
    name: String
    accessedByLifts: [Lift!]!
    status: Status!
    groomed: Boolean
    snowmaking: Boolean
    trees: Boolean
    night: Boolean
  }
  type Query {
    allLifts: [Lift!]!
  }
  type Mutation {
    setLiftStatus(id: ID!, status: Status!): Lift!
  }
`;

const resolvers = {
  Query: {
    allLifts: (parent, args, {lifts}) => {
      return lifts.find().toArray()
    }
  },
  Mutation: {
    // addLift: (parent, args, {lifts}) => {

    // },
    setLiftStatus: (parent, args) => {
      const liftId = args.id;
      const liftStatus = args.status;
      let updatedLift = lifts.find(lift => liftId === lift.id);
      updatedLift.status = liftStatus;
      return updatedLift;
    }
  },
  Lift: {
    trailAccess: (parent) => {
      return parent.trails.map(id => trails.find(t=> id === t.id)).filter(x=>x)
    }
  },
  Trail: {
    accessedByLifts: (parent) => {
      return parent.lift.map(id => lifts.find(l => id === l.id)).filter(x => x)
    }
  }

}

const start = async () => {

  const client = await MongoClient.connect(process.env.DB_HOST, { useNewUrlParser: true })
  const db = client.db()

  const server = new ApolloServer({
      typeDefs,
      resolvers,
      context: {
          lifts: db.collection('lifts'),
          trails: db.collection('trails')
      }
  })

  server.listen({port: 4040})
      .then(({ port }) => `server listening on ${port}`)
      .then(console.log)
      .catch(console.error)
}

start()