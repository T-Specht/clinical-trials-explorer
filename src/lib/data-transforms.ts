import { l } from "vite/dist/node/types.d-aGj9QkWt";
import { getAllEntries, getAllFilteredEntries } from "./database-wrappers";
import { useSettingsStore } from "./zustand";

const round = (num: number, decimals: number) => {
  //return Math.round(num * 10 ** decimals) / 10 ** decimals;
  return num;
};

const interalGetEntryData = () => {
  return getAllFilteredEntries(useSettingsStore.getState().filter);
};

export const geoHeatMap = async (decimals = 3) => {
  let data = await interalGetEntryData();

  let locationData = data
    .map((e) => e.rawJson?.contactsLocationsModule?.locations)
    .filter((e) => !!e && e.length > 0);

  let coords = locationData
    .map((e) => {
      return e!
        .map((l) => {
          let lat = round(l.geoPoint?.lat!, decimals);
          let lng = round(l.geoPoint?.lon!, decimals);

          return {
            lat,
            lng,
            c: `${lat}_${lng}`,
          };
        })
        .flat();
    })
    .flat();

  const plotData = coords.reduce<
    { lat: number; lng: number; z: number; c: string }[]
  >((acc, curr) => {
    //if(acc.)

    let i = acc.findIndex((e) => e.c == curr.c);
    if (i >= 0) {
      acc[i].z++;
    } else {
      acc.push({
        ...curr,
        z: 1,
      });
    }

    return acc;
  }, []);

  console.log(plotData);

  let lats = plotData.map((e) => e.lat);
  let lngs = plotData.map((e) => e.lng);
  let zs = plotData.map((e) => e.z);

  return { lats, lngs, zs };
};

export const aggreateByField = async <T extends {[key: string]: any}>(
  data: T[],
  field: keyof T,
  top = 20
) => {
  let c = data.reduce<{ [key: string]: number }>((acc, curr) => {
    let name = curr[field]?.toLowerCase() || "<na>";
    if (acc[name] == undefined) {
      acc[name] = 1;
    } else {
      acc[name]++;
    }

    return acc;
  }, {});

  let entries = Object.entries(c)
    .sort((a, b) => b[1] - a[1])
    .slice(0, top);

  let x = entries.map((e) => e[0]);
  let y = entries.map((e) => e[1]);
  return { x, y, c };
};

export const aggregateInterventions = async (top = 50) => {
  let data = await interalGetEntryData();
  let inter = data
    .map((e) => e.rawJson?.armsInterventionsModule?.interventions!)
    .filter((e) => !!e && e.length > 0)
    .flat();

  return aggreateByField(inter, "name", top);
};

export const aggregateConditions = async (top = 50) => {
  let data = await interalGetEntryData();
  let raw = data
    .map((e) => e.rawJson?.conditionsModule?.conditions)
    .flat()
    .map((e) => ({ conditionName: e! }));

  return aggreateByField(raw, "conditionName", top);
};

export const aggregateMeshTerms = async (top = 50) => {
  let data = await interalGetEntryData();
  let raw = data
    .map((e) => e.rawJson?.conditionBrowseModule?.meshes)
    .flat()
    .filter((e) => !!e);

  return aggreateByField(raw, "term", top);
};

export const aggregateHighRelevanceLeavesMeshTerms = async (top = 50) => {
  let data = await interalGetEntryData();
  let raw = data
    .map((e) => e.rawJson?.conditionBrowseModule?.browseLeaves)
    .flat()
    .filter((e) => !!e)
    .filter((e) => e.relevance == "HIGH" && e.name);

console.log(raw);


  return aggreateByField(raw, "name", top);
};

export const geoScannerPoints = async () => {
  return geoHeatMap();
};
