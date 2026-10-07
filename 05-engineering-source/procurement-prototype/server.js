// Process entry point. Composition and domain modules live in server-modules/.
const { createApplication } = require('./server-modules/application');
const application = createApplication({ root: __dirname });

if (require.main === module) {
  application.createServer().listen(application.port, () => {
    console.log(`Procurement prototype server listening at http://localhost:${application.port}`);
  });
}

module.exports = { createServer: application.createServer, memoryStore: application.memoryStore, publicUser: application.publicUser };
