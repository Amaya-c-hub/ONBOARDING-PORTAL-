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

async function seed() {
  try {
    await dataSource.initialize();
    console.log('Data Source has been initialized!');

    const userRepository = dataSource.getRepository(User);

    const usersToSeed = [
      { email: 'hr@example.com', role: Role.HR },
      { email: 'manager@example.com', role: Role.MANAGER },
      { email: 'candidate@example.com', role: Role.CANDIDATE },
    ];

    for (const u of usersToSeed) {
      const existing = await userRepository.findOneBy({ email: u.email });
      if (existing) {
        console.log(`User ${u.email} already exists, updating role to ${u.role}`);
        existing.role = u.role;
        await userRepository.save(existing);
      } else {
        console.log(`Creating user ${u.email} with role ${u.role}`);
        await userRepository.save(userRepository.create(u));
      }
    }

    console.log('Seeding completed successfully!');
  } catch (err) {
    console.error('Error during seeding:', err);
  } finally {
    await dataSource.destroy();
  }
}

seed();
