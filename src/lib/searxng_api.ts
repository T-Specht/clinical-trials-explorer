import axios from "axios";
import { useSettingsStore } from "./zustand";

export type SearxngAPIResponse = {
  query: string;
  number_of_results: number;
  results: Array<{
    url: string;
    title: string;
    content: string;
    engine: string;
    parsed_url: Array<string>;
    template: string;
    engines: Array<string>;
    positions: Array<number>;
    score: number;
    category: string;
    type?: string;
    authors?: Array<string>;
    publisher?: string;
    journal?: string;
    publishedDate?: string;
    comments?: string;
    html_url?: string;
    pdf_url?: string;
    doi?: string;
    tags?: Array<string>;
    issn?: Array<string>;
    issns?: Array<string>;
  }>;
  answers: Array<any>;
  corrections: Array<any>;
  infoboxes: Array<any>;
  suggestions: Array<string>;
  unresponsive_engines: Array<any>;
};

export async function searxng_api_search(
  q: string,
  limit = 5,
  options: Partial<{
    engines: string; // e.g. 'pubmed,semantic scholar,openairepublications,google_scholar
    categories: string; // e.g. 'science'
  }>
) {
  let results: SearxngAPIResponse = (
    await axios.get(useSettingsStore.getState().searxngUrl, {
      params: {
        q,
        format: "json",
        ...options,
      },
    })
  ).data;
  return results.results.slice(0, limit);
}
