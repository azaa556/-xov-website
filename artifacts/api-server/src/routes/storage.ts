import {
  RequestUploadUrlBody,
  RequestUploadUrlResponse,
} from "@workspace/api-zod";
import { Router, type IRouter, type Request, type Response } from "express";
import { isCmsAdmin } from "../lib/cmsAccess";
import {
  ALLOWED_IMAGE_TYPES,
  createMemberImageUpload,
  getPublicAsset,
  getUploadedMemberImage,
  ObjectNotFoundError,
  streamStoredFile,
} from "../lib/objectStorage";

const router: IRouter = Router();

function requireCmsAdmin(req: Request, res: Response): boolean {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Sign-in required" });
    return false;
  }
  if (!isCmsAdmin(req)) {
    res.status(403).json({ error: "CMS administrator access required" });
    return false;
  }
  return true;
}

router.post(
  "/storage/uploads/request-url",
  async (req: Request, res: Response): Promise<void> => {
    if (!requireCmsAdmin(req, res)) return;
    const parsed = RequestUploadUrlBody.safeParse(req.body);
    if (!parsed.success || !ALLOWED_IMAGE_TYPES.has(parsed.data.contentType)) {
      res.status(400).json({ error: "Choose a supported image under 10 MB" });
      return;
    }

    try {
      const upload = await createMemberImageUpload();
      res.json(
        RequestUploadUrlResponse.parse({
          ...upload,
          metadata: parsed.data,
        }),
      );
    } catch (error) {
      req.log.error(
        { errorName: error instanceof Error ? error.name : "Error" },
        "Could not generate a member image upload URL",
      );
      res.status(500).json({ error: "Could not prepare the image upload" });
    }
  },
);

router.get(
  "/storage/public-objects/*filePath",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const rawPath = req.params.filePath;
      const path = Array.isArray(rawPath) ? rawPath.join("/") : rawPath;
      const file = await getPublicAsset(path);
      if (!file) {
        res.status(404).json({ error: "File not found" });
        return;
      }
      await streamStoredFile(file, res, { publicCache: true }, (error) => {
        req.log.error(
          { errorName: error.name },
          "Could not stream a public asset",
        );
      });
    } catch (error) {
      req.log.error(
        { errorName: error instanceof Error ? error.name : "Error" },
        "Could not serve a public asset",
      );
      if (!res.headersSent) res.status(500).json({ error: "Could not serve asset" });
    }
  },
);

router.get(
  "/storage/objects/*path",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const rawPath = req.params.path;
      const path = Array.isArray(rawPath) ? rawPath.join("/") : rawPath;
      const file = await getUploadedMemberImage(`/objects/${path}`);
      const served = await streamStoredFile(file, res, {
        publicCache: true,
        imageOnly: true,
      }, (error) => {
        req.log.error(
          { errorName: error.name },
          "Could not stream a member image",
        );
      });
      if (!served) {
        res.status(404).json({ error: "Member image not found" });
      }
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        res.status(404).json({ error: "Member image not found" });
        return;
      }
      req.log.error(
        { errorName: error instanceof Error ? error.name : "Error" },
        "Could not serve a member image",
      );
      if (!res.headersSent) res.status(500).json({ error: "Could not serve image" });
    }
  },
);

export default router;