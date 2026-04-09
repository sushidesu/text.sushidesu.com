import type { DB } from "../db/client";
import { parse } from "../rsmarkup/parse";
import { render } from "../rsmarkup/render";
import { resolveImages } from "./resolve-images";

export const renderPostBody = async (
  body: string,
  db: DB,
  assetBaseUrl: string,
): Promise<string> => {
  const ast = parse(body);
  const resolved = await resolveImages(ast, db, assetBaseUrl);
  return render(resolved);
};
