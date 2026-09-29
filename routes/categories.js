const router = require('express').Router();
const Category = require('../models/Category');
const { requireAuth, requireAdmin } = require('../middleware/auth');
router.get('/', async (_req, res, next) => { try { res.json(await Category.find({ active: true }).sort({ name: 1 })); } catch (error) { next(error); } });
router.post('/', requireAuth, requireAdmin, async (req, res, next) => { try { if (!req.body.name) return res.status(400).json({ message: 'Category name is required.' }); res.status(201).json(await Category.create({ name: req.body.name, icon: req.body.icon })); } catch (error) { next(error); } });
router.patch('/:id', requireAuth, requireAdmin, async (req, res, next) => { try { const item = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }); if (!item) return res.status(404).json({ message: 'Category not found.' }); res.json(item); } catch (error) { next(error); } });
router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => { try { const item = await Category.findByIdAndDelete(req.params.id); if (!item) return res.status(404).json({ message: 'Category not found.' }); res.json({ message: 'Category deleted.' }); } catch (error) { next(error); } });
module.exports = router;
