import { db } from "./db";
import { requestVersions } from "./schema";
import { eq, and, desc, sql } from "drizzle-orm";

export async function saveVersion(
  requestId: string,
  type: "doc" | "prototype",
  content: string
): Promise<number> {
  // 원자적 삽입: 서브쿼리로 최대 버전 번호를 조회하면서 동시에 INSERT
  // UNIQUE 제약 조건(request_id, type, version)으로 중복 방지
  const result = await db.execute(sql`
    INSERT INTO request_versions (request_id, type, content, version, created_at)
    VALUES (
      ${requestId},
      ${type},
      ${content},
      COALESCE(
        (SELECT MAX(version) FROM request_versions
         WHERE request_id = ${requestId} AND type = ${type}),
        0
      ) + 1,
      NOW()
    )
    RETURNING version
  `);

  return result.rows[0].version as number;
}
