import { DataSource } from 'typeorm';
import { User, Role } from '../auth/entities/user.entity';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '../../.env') });

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User],
  synchronize: false,
});

async function listAndFix() {
  try {
    await dataSource.initialize();
    const repo = dataSource.getRepository(User);

    // 1. Ensure the canonical test accounts have correct roles
    const fixes = [
      { email: 'hr@example.com',        role: Role.HR },
      { email: 'manager@example.com',   role: Role.MANAGER },
      { email: 'candidate@example.com', role: Role.CANDIDATE },
      // Also fix any emails that got wrongly provisioned as CANDIDATE
      // during the old auto-provision era
      { email: 'hr@company.com',        role: Role.HR },
      { email: 'amayaami05@gmail.com',  role: Role.HR },
    ];

    for (const fix of fixes) {
      const user = await repo.findOneBy({ email: fix.email });
      if (user) {
        if (user.role !== fix.role) {
          await repo.update(user.id, { role: fix.role });
          console.log(`✅ Fixed ${fix.email}: ${user.role} → ${fix.role}`);
        } else {
          console.log(`✓  ${fix.email} already has role: ${fix.role}`);
        }
      } else {
        await repo.save(repo.create({ email: fix.email, role: fix.role }));
        console.log(`➕ Created ${fix.email} with role: ${fix.role}`);
      }
    }

    console.log('\n--- All Users in Database ---');
    const all = await repo.find({ order: { createdAt: 'ASC' } });
    all.forEach(u => {
      console.log(`  ${u.role.toUpperCase().padEnd(12)} | ${u.email.padEnd(35)} | active: ${u.isActive}`);
    });

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await dataSource.destroy();
  }
}

listAndFix();
