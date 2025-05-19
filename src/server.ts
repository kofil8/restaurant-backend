import app from './app';
import config from './config';
import seedSuperAdmin from './app/DB';

const port = config.port || process.env.PORT || 9001;

async function main() {
  app.listen(port, () => {
    console.log('Server is running on🚀➡️ ', `http://localhost:${port}`);
  });

  await seedSuperAdmin();
}

main();
