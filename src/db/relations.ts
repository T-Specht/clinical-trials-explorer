// import { relations } from "drizzle-orm/relations";
// import { entry, conditionMeshTermOnEntries, meshTerm, interventionMeshTermOnEntries, locationOnEntries, location, aiCache } from "./schema";

// export const conditionMeshTermOnEntriesRelations = relations(conditionMeshTermOnEntries, ({one}) => ({
// 	entry: one(entry, {
// 		fields: [conditionMeshTermOnEntries.entryId],
// 		references: [entry.id]
// 	}),
// 	meshTerm: one(meshTerm, {
// 		fields: [conditionMeshTermOnEntries.meshId],
// 		references: [meshTerm.id]
// 	}),
// }));

// export const entryRelations = relations(entry, ({many}) => ({
// 	conditionMeshTermOnEntries: many(conditionMeshTermOnEntries),
// 	interventionMeshTermOnEntries: many(interventionMeshTermOnEntries),
// 	locationOnEntries: many(locationOnEntries),
// 	aiCaches: many(aiCache),
// }));

// export const meshTermRelations = relations(meshTerm, ({many}) => ({
// 	conditionMeshTermOnEntries: many(conditionMeshTermOnEntries),
// 	interventionMeshTermOnEntries: many(interventionMeshTermOnEntries),
// }));

// export const interventionMeshTermOnEntriesRelations = relations(interventionMeshTermOnEntries, ({one}) => ({
// 	entry: one(entry, {
// 		fields: [interventionMeshTermOnEntries.entryId],
// 		references: [entry.id]
// 	}),
// 	meshTerm: one(meshTerm, {
// 		fields: [interventionMeshTermOnEntries.meshId],
// 		references: [meshTerm.id]
// 	}),
// }));

// export const locationOnEntriesRelations = relations(locationOnEntries, ({one}) => ({
// 	entry: one(entry, {
// 		fields: [locationOnEntries.entryId],
// 		references: [entry.id]
// 	}),
// 	location: one(location, {
// 		fields: [locationOnEntries.locationId],
// 		references: [location.id]
// 	}),
// }));

// export const locationRelations = relations(location, ({many}) => ({
// 	locationOnEntries: many(locationOnEntries),
// }));

// export const aiCacheRelations = relations(aiCache, ({one}) => ({
// 	entry: one(entry, {
// 		fields: [aiCache.entryId],
// 		references: [entry.id]
// 	}),
// }));