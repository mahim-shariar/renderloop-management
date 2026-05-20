import Client from '../models/Client.js';
import ApiError from '../utils/ApiError.js';

function buildQuery({ search, status }) {
  const filter = {};
  if (status) filter.status = status;
  if (search) {
    const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: re }, { company: re }, { email: re }];
  }
  return filter;
}

export async function listClients({ search, status, sort = '-createdAt', page = 1, limit = 25 }) {
  const filter = buildQuery({ search, status });
  const skip = (Math.max(1, page) - 1) * limit;
  const [items, total] = await Promise.all([
    Client.find(filter).sort(sort).skip(skip).limit(limit).lean({ virtuals: true }),
    Client.countDocuments(filter),
  ]);
  return { items, total, page, limit };
}

export async function getClient(id) {
  const client = await Client.findById(id).populate('communicationLog.author', 'name email avatarUrl');
  if (!client) throw ApiError.notFound('Client not found');
  return client;
}

export async function createClient(data, userId) {
  const client = await Client.create({ ...data, createdBy: userId });
  return client;
}

export async function updateClient(id, data) {
  const client = await Client.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!client) throw ApiError.notFound('Client not found');
  return client;
}

export async function deleteClient(id) {
  const client = await Client.findByIdAndDelete(id);
  if (!client) throw ApiError.notFound('Client not found');
  return client;
}

export async function addCommunicationNote(id, { body }, authorId) {
  const client = await Client.findById(id);
  if (!client) throw ApiError.notFound('Client not found');
  client.communicationLog.push({ body, author: authorId });
  client.lastContactedAt = new Date();
  await client.save();
  await client.populate('communicationLog.author', 'name email avatarUrl');
  return client;
}

export async function deleteCommunicationNote(id, noteId) {
  const client = await Client.findById(id);
  if (!client) throw ApiError.notFound('Client not found');
  const note = client.communicationLog.id(noteId);
  if (!note) throw ApiError.notFound('Note not found');
  note.deleteOne();
  await client.save();
  return client;
}
