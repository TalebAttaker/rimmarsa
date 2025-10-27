# Rimmarsa Documentation

Welcome to the Rimmarsa documentation. All project documentation has been organized into this directory for easy navigation.

---

## Documentation Structure

### [Architecture](./architecture/)
System architecture, technical specifications, and database schema documentation.

**Key Documents:**
- [SPECIFICATION.md](./architecture/SPECIFICATION.md) - Complete technical specification
- [CURRENT-STATE.md](./architecture/CURRENT-STATE.md) - Current system architecture
- [DATABASE.md](./architecture/DATABASE.md) - Database schema and RLS policies

### [Security](./security/)
Security policies, assessments, implementation guides, and security checklists.

**Key Documents:**
- [SECURITY_README.md](./security/SECURITY_README.md) - Security overview
- [SECURITY-CHECKLIST.md](./security/SECURITY-CHECKLIST.md) - Pre-deployment security checklist
- [SECURITY-UPGRADE-V1.6.0.md](./security/SECURITY-UPGRADE-V1.6.0.md) - Token-based upload security
- [MOBILE_APP_SECURITY_CHECKLIST.md](./security/MOBILE_APP_SECURITY_CHECKLIST.md) - Mobile app security

### [Development](./development/)
Code standards, development workflows, and refactoring plans.

**Key Documents:**
- [QUICK-START.md](./development/QUICK-START.md) - Get started with development
- [CODE-STANDARDS.md](./development/CODE-STANDARDS.md) - Coding guidelines and best practices
- [REFACTOR-PLAN.md](./development/REFACTOR-PLAN.md) - Codebase refactoring roadmap
- [REORGANIZATION-PLAN.md](./development/REORGANIZATION-PLAN.md) - Project reorganization plan

### [Deployment](./deployment/)
Build instructions, deployment guides, and release notes.

**Key Documents:**
- [BUILD_APK_INSTRUCTIONS.md](./deployment/BUILD_APK_INSTRUCTIONS.md) - Mobile app build guide
- [VERCEL_DEPLOYMENT.md](./deployment/VERCEL_DEPLOYMENT.md) - Web deployment guide
- [V1.5.0-RELEASE-NOTES.md](./deployment/V1.5.0-RELEASE-NOTES.md) - Release history

### [Testing](./testing/)
Testing guides, checklists, and testing status reports.

**Key Documents:**
- [MANUAL-TESTING-CHECKLIST.md](./testing/MANUAL-TESTING-CHECKLIST.md) - Pre-deployment testing checklist
- [MOBILE-APP-TESTING-GUIDE.md](./testing/MOBILE-APP-TESTING-GUIDE.md) - Mobile app testing procedures
- [R2-MIGRATION-TESTING-GUIDE.md](./testing/R2-MIGRATION-TESTING-GUIDE.md) - R2 migration validation

### [Archive](./archive/)
Historical documentation, session summaries, and outdated guides preserved for reference.

---

## Quick Navigation

### New to the Project?
1. Start with [Project README](../README.md) for overview
2. Read [QUICK-START.md](./development/QUICK-START.md) to set up your environment
3. Review [CURRENT-STATE.md](./architecture/CURRENT-STATE.md) to understand the architecture

### Working on Features?
1. Check [CODE-STANDARDS.md](./development/CODE-STANDARDS.md) for coding guidelines
2. Review [SPECIFICATION.md](./architecture/SPECIFICATION.md) for technical details
3. Follow [DEVELOPMENT-WORKFLOW.md](./archive/DEVELOPMENT-WORKFLOW.md) for workflow

### Deploying Changes?
1. Complete [MANUAL-TESTING-CHECKLIST.md](./testing/MANUAL-TESTING-CHECKLIST.md)
2. Review [SECURITY-CHECKLIST.md](./security/SECURITY-CHECKLIST.md)
3. Follow deployment guides in [deployment/](./deployment/)

### Security Review?
1. Start with [SECURITY_README.md](./security/SECURITY_README.md)
2. Check [SECURITY-ASSESSMENT-REPORT.md](./security/SECURITY-ASSESSMENT-REPORT.md)
3. Review [MOBILE_APP_SECURITY_CHECKLIST.md](./security/MOBILE_APP_SECURITY_CHECKLIST.md)

---

## Documentation Standards

When adding or updating documentation:

1. **Use clear headings** - Make documents scannable
2. **Include table of contents** - For documents > 100 lines
3. **Add code examples** - Show, don't just tell
4. **Update dates** - Include "Last Updated" at the top
5. **Link related docs** - Cross-reference relevant documents
6. **Use markdown** - Standard GitHub-flavored markdown

---

## Contributing to Documentation

1. **Create new docs** in the appropriate subdirectory
2. **Update this README** if adding new categories
3. **Follow naming conventions:**
   - UPPERCASE for important docs (README, SPECIFICATION)
   - kebab-case for guides (quick-start, setup-guide)
   - Use descriptive names

4. **Archive old docs** - Move outdated documentation to `archive/`

---

## Documentation Changelog

### 2025-10-27 - Major Reorganization
- Organized 60+ markdown files from root into structured `/docs/` directory
- Created comprehensive README.md in project root
- Added CURRENT-STATE.md architecture documentation
- Added QUICK-START.md development guide
- Established documentation standards

### Previous
- Documentation scattered across project root
- No clear organization or navigation
- Difficult to find relevant documents

---

## Need Help?

- **Can't find a document?** Check the [archive/](./archive/) directory
- **Documentation outdated?** Create an issue or submit a PR
- **Missing documentation?** Check `tasks.json` or create a request

---

**Last Updated:** 2025-10-27
**Maintained By:** Development Team
