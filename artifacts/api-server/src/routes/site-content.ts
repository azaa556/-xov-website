import {
  GetAdminSiteContentResponse,
  GetCmsAdminAccessResponse,
  GetPublicSiteContentResponse,
  UpdateAdminSiteContentBody,
  UpdateAdminSiteContentResponse,
} from "@workspace/api-zod";
import { db, siteContentTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { Router, type IRouter, type Request, type Response } from "express";
import { isCmsAdmin, isCmsAdminEmail } from "../lib/cmsAccess";

const router: IRouter = Router();
const CONTENT_ROW_ID = "public";
const MEMBER_IDS = ["azelyth", "riyuzi", "azaa", "shezi"];

const INITIAL_SITE_CONTENT = {
  members: [
    {
      id: "azelyth",
      name: "Azelyth Faeren",
      alias: "Eren/Ren",
      description: "Deskripsi member akan ditambahkan.",
      channel: "https://youtube.com/@zelren14?si=NcVyPXxS2c7NfIhX",
      imageUrl: null,
    },
    {
      id: "riyuzi",
      name: "Riyuzi Vynae",
      alias: "Riyu",
      description: "Deskripsi member akan ditambahkan.",
      channel: "https://www.youtube.com/@RiyuziVynae",
      imageUrl: null,
    },
    {
      id: "azaa",
      name: "Azaa Lockwood",
      alias: "Azaa",
      description: "Deskripsi member akan ditambahkan.",
      channel: "https://youtube.com/@azaalockwood?si=-I9GXMdRn6uAtvVJ",
      imageUrl: null,
    },
    {
      id: "shezi",
      name: "Shezi Asta Freola",
      alias: "Frell",
      description: "Deskripsi member akan ditambahkan.",
      channel: "https://www.youtube.com/@Rawrr_Frell",
      imageUrl: null,
    },
  ],
  theme: {
    base: "#100E14",
    violet: "#BD67FF",
    magenta: "#FF4F9A",
  },
};

async function readSiteContent() {
  const [existing] = await db
    .select()
    .from(siteContentTable)
    .where(eq(siteContentTable.id, CONTENT_ROW_ID));
  if (existing) return existing.content;

  await db
    .insert(siteContentTable)
    .values({ id: CONTENT_ROW_ID, content: INITIAL_SITE_CONTENT })
    .onConflictDoNothing();

  const [seeded] = await db
    .select()
    .from(siteContentTable)
    .where(eq(siteContentTable.id, CONTENT_ROW_ID));
  if (!seeded) throw new Error("Could not initialize public site content");
  return seeded.content;
}

function requireAdmin(req: Request, res: Response): boolean {
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

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isSafeImageUrl(value: string | null): boolean {
  if (value === null) return true;
  if (value.startsWith("/api/storage/objects/uploads/")) return true;
  return isHttpUrl(value);
}

router.get("/admin/access", (req: Request, res: Response): void => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Sign-in required" });
    return;
  }
  res.json(
    GetCmsAdminAccessResponse.parse({
      authorized: isCmsAdminEmail(req.user.email),
    }),
  );
});

router.get("/site-content", async (_req: Request, res: Response): Promise<void> => {
  const content = await readSiteContent();
  res.json(GetPublicSiteContentResponse.parse(content));
});

router.get("/admin/site-content", async (req: Request, res: Response): Promise<void> => {
  if (!requireAdmin(req, res)) return;
  const content = await readSiteContent();
  res.json(GetAdminSiteContentResponse.parse(content));
});

router.patch("/admin/site-content", async (req: Request, res: Response): Promise<void> => {
  if (!requireAdmin(req, res)) return;

  const parsed = UpdateAdminSiteContentBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ issues: parsed.error.issues }, "Invalid CMS content update");
    res.status(400).json({ error: "Invalid site content" });
    return;
  }

  const content = parsed.data;
  const memberIds = content.members.map((member) => member.id);
  if (
    memberIds.length !== MEMBER_IDS.length ||
    memberIds.some((id, index) => id !== MEMBER_IDS[index]) ||
    content.members.some(
      (member) =>
        !isHttpUrl(member.channel) || !isSafeImageUrl(member.imageUrl),
    )
  ) {
    res.status(400).json({ error: "Member IDs or image/channel links are invalid" });
    return;
  }

  const [updated] = await db
    .insert(siteContentTable)
    .values({ id: CONTENT_ROW_ID, content })
    .onConflictDoUpdate({
      target: siteContentTable.id,
      set: { content, updatedAt: new Date() },
    })
    .returning();

  if (!updated) {
    res.status(500).json({ error: "Could not save site content" });
    return;
  }
  res.json(UpdateAdminSiteContentResponse.parse(updated.content));
});

export default router;