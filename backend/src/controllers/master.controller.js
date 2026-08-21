import { locationService } from '../services/location.service.js';
import { itemService } from '../services/item.service.js';
import { userService } from '../services/user.service.js';

export class LocationController {
  async getAllLocations(req, res, next) {
    try {
      const locations = await locationService.getAllLocations();
      res.status(200).json({ success: true, data: locations });
    } catch (err) {
      next(err);
    }
  }

  async createLocation(req, res, next) {
    try {
      const location = await locationService.createLocation(req.body);
      res.status(201).json({ success: true, data: location });
    } catch (err) {
      next(err);
    }
  }
}

export class ItemController {
  async getAllItems(req, res, next) {
    try {
      const items = await itemService.getAllItems();
      res.status(200).json({ success: true, data: items });
    } catch (err) {
      next(err);
    }
  }

  async createItem(req, res, next) {
    try {
      const item = await itemService.createItem(req.body);
      res.status(201).json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  }
}

export class UserController {
  async getAllUsers(req, res, next) {
    try {
      const users = await userService.getAllUsers();
      res.status(200).json({ success: true, data: users });
    } catch (err) {
      next(err);
    }
  }

  async createUser(req, res, next) {
    try {
      const user = await userService.createUser(req.body);
      res.status(201).json({ success: true, message: 'Employee added successfully', data: user });
    } catch (err) {
      next(err);
    }
  }

  async updateUser(req, res, next) {
    try {
      const user = await userService.updateUser(req.params.id, req.body);
      res.status(200).json({ success: true, message: 'Employee updated successfully', data: user });
    } catch (err) {
      next(err);
    }
  }

  async deleteUser(req, res, next) {
    try {
      const result = await userService.deleteUser(req.params.id, req.user.id);
      res.status(200).json({ success: true, message: result.message });
    } catch (err) {
      next(err);
    }
  }
}

export const locationController = new LocationController();
export const itemController = new ItemController();
export const userController = new UserController();
