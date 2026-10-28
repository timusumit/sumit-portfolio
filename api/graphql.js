import mongoose from "mongoose";
import { graphql, buildSchema } from "graphql";

// 1. Connect to MongoDB Atlas (Cached for fast serverless execution)
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI environment variable is missing");
  }
  await mongoose.connect(process.env.MONGO_URI);
  isConnected = true;
};

// 2. Mongoose Database Schema
const messageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Message =
  mongoose.models.Message || mongoose.model("Message", messageSchema);

// 3. GraphQL Schema Definition
const schema = buildSchema(`
  type Message {
    id: ID!
    name: String!
    email: String!
    message: String!
    createdAt: String!
  }

  type Query {
    getMessages(adminSecret: String!): [Message]
  }

  type Mutation {
    sendMessage(name: String!, email: String!, message: String!): Message
  }
`);

// 4. GraphQL Resolvers
const rootValue = {
  // Admin Query: Fetch all messages if secret password matches
  getMessages: async ({ adminSecret }) => {
    if (adminSecret !== process.env.ADMIN_SECRET) {
      throw new Error("Unauthorized: Wrong Admin Password");
    }
    const msgs = await Message.find().sort({ createdAt: -1 });
    return msgs.map((m) => ({
      id: m._id.toString(),
      name: m.name,
      email: m.email,
      message: m.message,
      createdAt: m.createdAt.getTime().toString(),
    }));
  },

  // Public Mutation: Save new contact form message
  sendMessage: async ({ name, email, message }) => {
    const newMsg = new Message({ name, email, message });
    const saved = await newMsg.save();
    return {
      id: saved._id.toString(),
      name: saved.name,
      email: saved.email,
      message: saved.message,
      createdAt: saved.createdAt.getTime().toString(),
    };
  },
};

// 5. Serverless Handler (With CORS enabled for sumitmaharjan.com.np)
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle browser preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ error: "Method Not Allowed. Use POST for GraphQL." });
  }

  try {
    await connectDB();
    const { query, variables } = req.body;

    const response = await graphql({
      schema,
      source: query,
      rootValue,
      variableValues: variables,
    });

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ errors: [{ message: error.message }] });
  }
}
