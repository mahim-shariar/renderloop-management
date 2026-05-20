import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/client.service.js';

export const list = asyncHandler(async (req, res) => {
  const { search, status, sort, page, limit } = req.query;
  const data = await svc.listClients({
    search,
    status,
    sort: sort || '-createdAt',
    page: page ? Number(page) : 1,
    limit: limit ? Math.min(500, Number(limit)) : 25,
  });
  res.json({ success: true, data });
});

export const get = asyncHandler(async (req, res) => {
  const client = await svc.getClient(req.params.id);
  res.json({ success: true, data: { client } });
});

export const create = asyncHandler(async (req, res) => {
  const client = await svc.createClient(req.body, req.user._id);
  res.status(201).json({ success: true, data: { client } });
});

export const update = asyncHandler(async (req, res) => {
  const client = await svc.updateClient(req.params.id, req.body);
  res.json({ success: true, data: { client } });
});

export const remove = asyncHandler(async (req, res) => {
  await svc.deleteClient(req.params.id);
  res.json({ success: true, message: 'Client deleted' });
});

export const addNote = asyncHandler(async (req, res) => {
  const client = await svc.addCommunicationNote(req.params.id, req.body, req.user._id);
  res.status(201).json({ success: true, data: { client } });
});

export const removeNote = asyncHandler(async (req, res) => {
  const client = await svc.deleteCommunicationNote(req.params.id, req.params.noteId);
  res.json({ success: true, data: { client } });
});
