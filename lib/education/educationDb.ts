import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function getStudents(companyId: string | null, search?: string) {
  if ((prisma as any).academyStudent) {
    const where: any = companyId ? { companyId } : {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { studentId: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { schoolOrCollege: { contains: search, mode: "insensitive" } },
      ];
    }
    return (prisma as any).academyStudent.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  // Fallback to raw Postgres query
  let sql = `SELECT * FROM "AcademyStudent" WHERE 1=1`;
  const params: any[] = [];
  if (companyId) {
    params.push(companyId);
    sql += ` AND "companyId" = $${params.length}`;
  }
  if (search) {
    params.push(`%${search}%`);
    const idx = params.length;
    sql += ` AND ("name" ILIKE $${idx} OR "studentId" ILIKE $${idx} OR "phone" ILIKE $${idx} OR "email" ILIKE $${idx} OR "schoolOrCollege" ILIKE $${idx})`;
  }
  sql += ` ORDER BY "createdAt" DESC`;
  return prisma.$queryRawUnsafe(sql, ...params);
}

export async function createStudent(data: {
  companyId: string;
  name: string;
  studentId?: string;
  email?: string | null;
  phone?: string | null;
  gender?: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
  className?: string | null;
  schoolOrCollege?: string | null;
  status?: string;
  admissionDate?: Date | null;
}) {
  if ((prisma as any).academyStudent) {
    return (prisma as any).academyStudent.create({ data });
  }

  const id = crypto.randomUUID();
  const studentId = data.studentId || `STU-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date();
  const sql = `
    INSERT INTO "AcademyStudent" ("id", "studentId", "name", "email", "phone", "gender", "guardianName", "guardianPhone", "className", "schoolOrCollege", "status", "admissionDate", "companyId", "createdAt", "updatedAt")
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING *
  `;
  const result: any = await prisma.$queryRawUnsafe(
    sql,
    id,
    studentId,
    data.name,
    data.email || null,
    data.phone || null,
    data.gender || null,
    data.guardianName || null,
    data.guardianPhone || null,
    data.className || null,
    data.schoolOrCollege || null,
    data.status || "ACTIVE",
    data.admissionDate || now,
    data.companyId,
    now,
    now
  );
  return result[0];
}

export async function deleteStudent(id: string, companyId: string) {
  if ((prisma as any).academyStudent) {
    return (prisma as any).academyStudent.deleteMany({ where: { id, companyId } });
  }
  return prisma.$executeRawUnsafe(
    `DELETE FROM "AcademyStudent" WHERE "id" = $1 AND "companyId" = $2`,
    id,
    companyId
  );
}

export async function getTeachers(companyId: string | null, search?: string) {
  if ((prisma as any).academyTeacher) {
    const where: any = companyId ? { companyId } : {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { teacherId: { contains: search, mode: "insensitive" } },
        { department: { contains: search, mode: "insensitive" } },
        { designation: { contains: search, mode: "insensitive" } },
      ];
    }
    return (prisma as any).academyTeacher.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  let sql = `SELECT * FROM "AcademyTeacher" WHERE 1=1`;
  const params: any[] = [];
  if (companyId) {
    params.push(companyId);
    sql += ` AND "companyId" = $${params.length}`;
  }
  if (search) {
    params.push(`%${search}%`);
    const idx = params.length;
    sql += ` AND ("name" ILIKE $${idx} OR "teacherId" ILIKE $${idx} OR "department" ILIKE $${idx} OR "designation" ILIKE $${idx})`;
  }
  sql += ` ORDER BY "createdAt" DESC`;
  return prisma.$queryRawUnsafe(sql, ...params);
}

export async function createTeacher(data: {
  companyId: string;
  name: string;
  teacherId?: string;
  email?: string | null;
  phone?: string | null;
  designation?: string | null;
  department?: string | null;
  salary?: number;
  compensationType?: string;
  projectRate?: number;
  status?: string;
  joiningDate?: Date | null;
}) {
  if ((prisma as any).academyTeacher) {
    return (prisma as any).academyTeacher.create({ data });
  }

  const id = crypto.randomUUID();
  const teacherId = data.teacherId || `TCH-${Math.floor(100 + Math.random() * 900)}`;
  const now = new Date();
  const sql = `
    INSERT INTO "AcademyTeacher" ("id", "teacherId", "name", "email", "phone", "designation", "department", "salary", "compensationType", "projectRate", "status", "joiningDate", "companyId", "createdAt", "updatedAt")
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING *
  `;
  const result: any = await prisma.$queryRawUnsafe(
    sql,
    id,
    teacherId,
    data.name,
    data.email || null,
    data.phone || null,
    data.designation || null,
    data.department || null,
    data.salary || 0,
    data.compensationType || "SALARY",
    data.projectRate || 0,
    data.status || "ACTIVE",
    data.joiningDate || now,
    data.companyId,
    now,
    now
  );
  return result[0];
}

export async function deleteTeacher(id: string, companyId: string) {
  if ((prisma as any).academyTeacher) {
    return (prisma as any).academyTeacher.deleteMany({ where: { id, companyId } });
  }
  return prisma.$executeRawUnsafe(
    `DELETE FROM "AcademyTeacher" WHERE "id" = $1 AND "companyId" = $2`,
    id,
    companyId
  );
}

export async function getSubjects(companyId: string | null, search?: string) {
  if ((prisma as any).academySubject) {
    const where: any = companyId ? { companyId } : {};
    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { department: { contains: search, mode: "insensitive" } },
      ];
    }
    return (prisma as any).academySubject.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  let sql = `SELECT * FROM "AcademySubject" WHERE 1=1`;
  const params: any[] = [];
  if (companyId) {
    params.push(companyId);
    sql += ` AND "companyId" = $${params.length}`;
  }
  if (search) {
    params.push(`%${search}%`);
    const idx = params.length;
    sql += ` AND ("code" ILIKE $${idx} OR "name" ILIKE $${idx} OR "department" ILIKE $${idx})`;
  }
  sql += ` ORDER BY "createdAt" DESC`;
  return prisma.$queryRawUnsafe(sql, ...params);
}

export async function createSubject(data: {
  companyId: string;
  code: string;
  name: string;
  department?: string | null;
  creditHours?: number;
  description?: string | null;
  status?: string;
}) {
  if ((prisma as any).academySubject) {
    return (prisma as any).academySubject.create({ data });
  }

  const id = crypto.randomUUID();
  const now = new Date();
  const sql = `
    INSERT INTO "AcademySubject" ("id", "code", "name", "department", "creditHours", "description", "status", "companyId", "createdAt", "updatedAt")
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;
  const result: any = await prisma.$queryRawUnsafe(
    sql,
    id,
    data.code,
    data.name,
    data.department || null,
    data.creditHours || 3,
    data.description || null,
    data.status || "ACTIVE",
    data.companyId,
    now,
    now
  );
  return result[0];
}

export async function deleteSubject(id: string, companyId: string) {
  if ((prisma as any).academySubject) {
    return (prisma as any).academySubject.deleteMany({ where: { id, companyId } });
  }
  return prisma.$executeRawUnsafe(
    `DELETE FROM "AcademySubject" WHERE "id" = $1 AND "companyId" = $2`,
    id,
    companyId
  );
}

// --------------------------------------------------------------------------
// ACADEMIC DEPARTMENTS (Subject-wise, e.g. Computer Science, Science, Business)
// --------------------------------------------------------------------------
export async function getAcademyDepartments(companyId: string | null, search?: string) {
  let departments: any[] = [];
  if ((prisma as any).academyDepartment) {
    const where: any = companyId ? { companyId } : {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    departments = await (prisma as any).academyDepartment.findMany({
      where,
      orderBy: { name: "asc" },
    });
  } else {
    let sql = `SELECT * FROM "AcademyDepartment" WHERE 1=1`;
    const params: any[] = [];
    if (companyId) {
      params.push(companyId);
      sql += ` AND "companyId" = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      const idx = params.length;
      sql += ` AND ("name" ILIKE $${idx} OR "code" ILIKE $${idx} OR "description" ILIKE $${idx})`;
    }
    sql += ` ORDER BY "name" ASC`;
    departments = await prisma.$queryRawUnsafe(sql, ...params);
  }

  // If no departments exist yet for this company, seed default academic departments
  if (departments.length === 0 && companyId) {
    const defaults = [
      { name: "Computer Science", code: "CS", description: "Computer Science, Programming & IT", headOfDepartment: "Lead CS Professor" },
      { name: "Science & Mathematics", code: "SCI", description: "Physics, Chemistry, Biology & Math", headOfDepartment: "Dean of Science" },
      { name: "Business Studies", code: "BUS", description: "Accounting, Finance & Management", headOfDepartment: "Lead Business Faculty" },
      { name: "Humanities & Arts", code: "ARTS", description: "Literature, History & Social Science", headOfDepartment: "Dean of Humanities" },
      { name: "Languages & Linguistics", code: "LANG", description: "English, Bangla & Foreign Languages", headOfDepartment: "Head of Languages" },
    ];

    for (const d of defaults) {
      await createAcademyDepartment({
        companyId,
        name: d.name,
        code: d.code,
        description: d.description,
        headOfDepartment: d.headOfDepartment,
      });
    }

    // Re-fetch after seeding
    return getAcademyDepartments(companyId, search);
  }

  return departments;
}

export async function createAcademyDepartment(data: {
  companyId: string;
  name: string;
  code?: string | null;
  description?: string | null;
  headOfDepartment?: string | null;
}) {
  if ((prisma as any).academyDepartment) {
    return (prisma as any).academyDepartment.create({ data });
  }

  const id = crypto.randomUUID();
  const now = new Date();
  const sql = `
    INSERT INTO "AcademyDepartment" ("id", "name", "code", "description", "headOfDepartment", "companyId", "createdAt", "updatedAt")
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  const result: any = await prisma.$queryRawUnsafe(
    sql,
    id,
    data.name,
    data.code || null,
    data.description || null,
    data.headOfDepartment || null,
    data.companyId,
    now,
    now
  );
  return result[0];
}

export async function deleteAcademyDepartment(id: string, companyId: string) {
  if ((prisma as any).academyDepartment) {
    return (prisma as any).academyDepartment.deleteMany({ where: { id, companyId } });
  }
  return prisma.$executeRawUnsafe(
    `DELETE FROM "AcademyDepartment" WHERE "id" = $1 AND "companyId" = $2`,
    id,
    companyId
  );
}

// --------------------------------------------------------------------------
// CLASSES
// --------------------------------------------------------------------------
export async function getClasses(companyId: string | null, search?: string) {
  if ((prisma as any).academyClass) {
    const where: any = companyId ? { companyId } : {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { section: { contains: search, mode: "insensitive" } },
        { subjectName: { contains: search, mode: "insensitive" } },
        { teacherName: { contains: search, mode: "insensitive" } },
        { room: { contains: search, mode: "insensitive" } },
      ];
    }
    return (prisma as any).academyClass.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  let sql = `SELECT * FROM "AcademyClass" WHERE 1=1`;
  const params: any[] = [];
  if (companyId) {
    params.push(companyId);
    sql += ` AND "companyId" = $${params.length}`;
  }
  if (search) {
    params.push(`%${search}%`);
    const idx = params.length;
    sql += ` AND ("name" ILIKE $${idx} OR "section" ILIKE $${idx} OR "subjectName" ILIKE $${idx} OR "teacherName" ILIKE $${idx} OR "room" ILIKE $${idx})`;
  }
  sql += ` ORDER BY "createdAt" DESC`;
  return prisma.$queryRawUnsafe(sql, ...params);
}

export async function createClass(data: {
  companyId: string;
  name: string;
  section?: string | null;
  subjectCode?: string | null;
  subjectName?: string | null;
  teacherId?: string | null;
  teacherName?: string | null;
  schedule?: string | null;
  room?: string | null;
  capacity?: number;
}) {
  if ((prisma as any).academyClass) {
    return (prisma as any).academyClass.create({ data });
  }

  const id = crypto.randomUUID();
  const now = new Date();
  const sql = `
    INSERT INTO "AcademyClass" ("id", "name", "section", "subjectCode", "subjectName", "teacherId", "teacherName", "schedule", "room", "capacity", "companyId", "createdAt", "updatedAt")
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *
  `;
  const result: any = await prisma.$queryRawUnsafe(
    sql,
    id,
    data.name,
    data.section || null,
    data.subjectCode || null,
    data.subjectName || null,
    data.teacherId || null,
    data.teacherName || null,
    data.schedule || null,
    data.room || null,
    data.capacity || 40,
    data.companyId,
    now,
    now
  );
  return result[0];
}

export async function deleteClass(id: string, companyId: string) {
  if ((prisma as any).academyClass) {
    return (prisma as any).academyClass.deleteMany({ where: { id, companyId } });
  }
  return prisma.$executeRawUnsafe(
    `DELETE FROM "AcademyClass" WHERE "id" = $1 AND "companyId" = $2`,
    id,
    companyId
  );
}

// --------------------------------------------------------------------------
// FINANCE
// --------------------------------------------------------------------------
export async function getFeesAndSummary(companyId: string | null, status?: string) {
  let fees: any[] = [];
  let teachers: any[] = [];

  if ((prisma as any).academyFee) {
    const where: any = companyId ? { companyId } : {};
    if (status && status !== "ALL") {
      where.status = status;
    }
    fees = await (prisma as any).academyFee.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    teachers = await (prisma as any).academyTeacher.findMany({
      where: companyId ? { companyId } : {},
      select: { salary: true, compensationType: true, projectRate: true },
    });
  } else {
    let sql = `SELECT * FROM "AcademyFee" WHERE 1=1`;
    const params: any[] = [];
    if (companyId) {
      params.push(companyId);
      sql += ` AND "companyId" = $${params.length}`;
    }
    if (status && status !== "ALL") {
      params.push(status);
      sql += ` AND "status" = $${params.length}`;
    }
    sql += ` ORDER BY "createdAt" DESC`;
    fees = await prisma.$queryRawUnsafe(sql, ...params);

    let tSql = `SELECT "salary", "compensationType", "projectRate" FROM "AcademyTeacher" WHERE 1=1`;
    const tParams: any[] = [];
    if (companyId) {
      tParams.push(companyId);
      tSql += ` AND "companyId" = $1`;
    }
    teachers = await prisma.$queryRawUnsafe(tSql, ...tParams);
  }

  let totalBilled = 0;
  let totalCollected = 0;
  let totalDues = 0;

  fees.forEach((f: any) => {
    const amt = Number(f.amount) || 0;
    const paid = Number(f.paidAmount) || 0;
    const due = Number(f.dueAmount) || 0;
    totalBilled += amt;
    totalCollected += paid;
    totalDues += due;
  });

  let totalTeacherSalary = 0;
  let totalProjectTeacherOutlay = 0;

  teachers.forEach((t: any) => {
    if (t.compensationType === "PROJECT") {
      totalProjectTeacherOutlay += Number(t.projectRate) || 0;
    } else {
      totalTeacherSalary += Number(t.salary) || 0;
    }
  });

  const totalFacultyOutlay = totalTeacherSalary + totalProjectTeacherOutlay;

  return {
    fees,
    summary: {
      totalBilled,
      totalCollected,
      totalDues,
      totalTeacherSalary,
      totalProjectTeacherOutlay,
      totalFacultyOutlay,
      netAcademyMargin: totalCollected - totalFacultyOutlay,
    },
  };
}

export async function createFee(data: {
  companyId: string;
  studentId?: string;
  studentName: string;
  feeType?: string;
  amount: number;
  paidAmount?: number;
  dueDate?: Date | null;
}) {
  const amt = Number(data.amount) || 0;
  const paid = Number(data.paidAmount) || 0;
  const due = Math.max(0, amt - paid);
  const status = due === 0 ? "PAID" : paid > 0 ? "PARTIAL" : "PENDING";
  const studentId = data.studentId || `STU-${Math.floor(1000 + Math.random() * 9000)}`;
  const feeType = data.feeType || "Tuition Fee";
  const dueDate = data.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const paymentDate = paid > 0 ? new Date() : null;

  if ((prisma as any).academyFee) {
    return (prisma as any).academyFee.create({
      data: {
        companyId: data.companyId,
        studentId,
        studentName: data.studentName,
        feeType,
        amount: amt,
        paidAmount: paid,
        dueAmount: due,
        status,
        dueDate,
        paymentDate,
      },
    });
  }

  const id = crypto.randomUUID();
  const now = new Date();
  const sql = `
    INSERT INTO "AcademyFee" ("id", "studentId", "studentName", "feeType", "amount", "paidAmount", "dueAmount", "status", "dueDate", "paymentDate", "companyId", "createdAt", "updatedAt")
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *
  `;
  const result: any = await prisma.$queryRawUnsafe(
    sql,
    id,
    studentId,
    data.studentName,
    feeType,
    amt,
    paid,
    due,
    status,
    dueDate,
    paymentDate,
    data.companyId,
    now,
    now
  );
  return result[0];
}

export async function recordFeePayment(id: string, companyId: string, paymentAmt: number) {
  if ((prisma as any).academyFee) {
    const existing = await (prisma as any).academyFee.findFirst({
      where: { id, companyId },
    });
    if (!existing) return null;

    const currentPaid = Number(existing.paidAmount) || 0;
    const totalAmount = Number(existing.amount) || 0;
    const newPaid = Math.min(totalAmount, currentPaid + paymentAmt);
    const newDue = Math.max(0, totalAmount - newPaid);
    const newStatus = newDue === 0 ? "PAID" : newPaid > 0 ? "PARTIAL" : "PENDING";

    return (prisma as any).academyFee.update({
      where: { id },
      data: {
        paidAmount: newPaid,
        dueAmount: newDue,
        status: newStatus,
        paymentDate: new Date(),
      },
    });
  }

  const existingRows: any = await prisma.$queryRawUnsafe(
    `SELECT * FROM "AcademyFee" WHERE "id" = $1 AND "companyId" = $2 LIMIT 1`,
    id,
    companyId
  );
  if (!existingRows || existingRows.length === 0) return null;
  const existing = existingRows[0];

  const currentPaid = Number(existing.paidAmount) || 0;
  const totalAmount = Number(existing.amount) || 0;
  const newPaid = Math.min(totalAmount, currentPaid + paymentAmt);
  const newDue = Math.max(0, totalAmount - newPaid);
  const newStatus = newDue === 0 ? "PAID" : newPaid > 0 ? "PARTIAL" : "PENDING";
  const now = new Date();

  const result: any = await prisma.$queryRawUnsafe(
    `UPDATE "AcademyFee" 
     SET "paidAmount" = $1, "dueAmount" = $2, "status" = $3, "paymentDate" = $4, "updatedAt" = $4
     WHERE "id" = $5 AND "companyId" = $6
     RETURNING *`,
    newPaid,
    newDue,
    newStatus,
    now,
    id,
    companyId
  );
  return result[0];
}
