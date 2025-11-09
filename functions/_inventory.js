import inventory from './_inventory-data.json' assert { type: 'json' };

export const INVENTORY = inventory;
export const INVENTORY_MAP = new Map(INVENTORY.map((item) => [item.id, item]));
