# ADR-008: Redis Strategy and Infrastructure as Code Migration

**Status:** Accepted  
**Date:** 2026-02-06  
**Deciders:** Carlos Jimenez (Student), Senior Architect (Mentor)  
**Tags:** infrastructure, redis, cost-optimization, terraform, iac

---

## Context

The project was using **Azure Cache for Redis Basic C0 (250MB)** at a cost of **€59/month** (~€708/year). This is expensive for a Basic tier instance used solely for BullMQ job queues.

### Issues with Current Setup

1. **Excessive Cost**: €59/month for 250MB Redis is expensive for a queue-based workload
2. **Retirement Notice**: Azure Cache for Redis is retiring September 30, 2028
3. **Manual Infrastructure**: No Infrastructure as Code (IaC), all resources created manually via Azure Portal
4. **Limited Features**: Basic tier doesn't support:
   - Clustering
   - Geo-replication
   - Redis modules (RedisJSON, RediSearch, etc.)
   - High availability

### Current Usage

- **Use case**: BullMQ job queue for async document processing (text extraction, chunking, embedding generation)
- **Data**: Transient job data (no persistence required - jobs can be retried)
- **Traffic**: Low to moderate (< 100 jobs/day for student project)
- **Criticality**: Medium (can tolerate brief downtime during development)

### Investigation: Azure Managed Redis

Initial investigation considered **Azure Managed Redis** (the successor to Azure Cache for Redis) as a cost-saving option.

**Reality Check**:

- Azure Managed Redis uses `azurerm_redis_enterprise_cluster` provider
- **Minimum SKU**: Enterprise_E5 (~€200-300/month) or EnterpriseFlash_F300 (~€800-1000/month)
- **Conclusion**: Azure Managed Redis is **NOT cheaper** - it's 4-6X MORE expensive than current setup
- Target audience: Large enterprises needing 99.999% uptime, active-active geo-replication, and Redis modules

---

## Decision

**KEEP Azure Cache for Redis (Basic C0) until retirement date (2028)**

### Rationale

1. **Cost Reality**: Azure Managed Redis is NOT a cost-effective replacement for small projects
2. **Time Buffer**: 2+ years until retirement (plenty of time to evaluate alternatives)
3. **Sufficient for Current Needs**: Basic C0 works fine for BullMQ queues
4. **Implement IaC Now**: Manage existing infrastructure with Terraform for reproducibility

### Immediate Actions (Completed)

- ✅ Create Terraform modules for ALL Azure infrastructure (not just Redis)
- ✅ Manage existing Azure Cache for Redis with Terraform
- ✅ Document architecture and deployment process
- ✅ Version control all infrastructure configuration

### Future Migration Options (Evaluate before 2028)

**Option A: Upstash Redis (Serverless)** ⭐ RECOMMENDED

- **Cost**: Free tier (10K commands/day) or ~€5-15/month pay-as-you-go
- **Pros**: Redis 7.x, serverless, zero maintenance, modern features
- **Cons**: Outside Azure (slight latency increase, not critical for queues)
- **Best for**: Cost-conscious projects with variable workloads

**Option B: Redis Cloud (Redis Labs)**

- **Cost**: Free tier (30MB) or from €7/month
- **Pros**: Official Redis Labs service, good performance
- **Cons**: Pricing scales quickly with data size

**Option C: Self-Hosted Redis on Azure Container Instances**

- **Cost**: ~€10-15/month (just compute)
- **Pros**: Full control, Redis OSS latest version, learning opportunity
- **Cons**: Manual management of backups, updates, monitoring

**Option D: Azure Cache for Redis Premium**

- **Cost**: ~€40-80/month (if still available)
- **Pros**: Stays in Azure, supports Redis modules
- **Cons**: More expensive, unclear if Premium survives post-2028

---

## Consequences

### Positive

1. **Infrastructure as Code**:
   - ✅ All infrastructure now versioned in Git with Terraform
   - ✅ Reproducible deployments
   - ✅ Easy to spin up dev/staging/prod environments
   - ✅ Changes are reviewable and documented

2. **Cost Management**:
   - ✅ Avoided €200-300/month Redis Enterprise mistake
   - ✅ Saved 2-3 days by not implementing unnecessary migration
   - ✅ Clear cost estimate documented (~€91-98/month total infrastructure)

3. **Time to Evaluate**:
   - ✅ 2+ years to research and test alternatives before 2028
   - ✅ Can wait for new Azure offerings or pricing changes
   - ✅ Time to test Upstash/Redis Cloud in dev environment

4. **Learning Opportunity**:
   - ✅ Learned to validate cost assumptions before migrating
   - ✅ Terraform/OpenTofu experience with real infrastructure
   - ✅ Better understanding of Azure pricing models

### Negative

1. **Temporary High Cost**:
   - ❌ Still paying €59/month for Redis (expensive but manageable)
   - ❌ Total infrastructure cost remains ~€91-98/month

2. **Future Migration Still Needed**:
   - ⚠️ Will need to migrate before September 2028
   - ⚠️ Another round of testing and validation required

3. **No Modern Redis Features**:
   - ⚠️ Can't use RedisJSON, RediSearch, etc. in current setup
   - ⚠️ Stuck with Redis 6.0 (vs Redis 7.x)

---

## Implementation Summary

### What Was Built

1. **Terraform Configuration** (`terraform/`):
   - Complete IaC for all 12 Azure resources
   - Modular design (separate modules for Redis, PostgreSQL, Storage, etc.)
   - Documented variables and outputs
   - Production-ready with proper security (Key Vault integration)

2. **Documentation**:
   - Comprehensive Terraform README
   - Architecture diagrams and cost estimates
   - Deployment guides
   - This ADR for decision tracking

3. **Scripts**:
   - Module generation script
   - Deployment automation helpers

### What Was NOT Migrated

- ❌ Redis instance (keeping existing Azure Cache for Redis Basic C0)
- ❌ Any data migration or downtime
- ❌ Application code changes

---

## Monitoring & Cost Tracking

### Success Metrics

- ✅ Infrastructure reproducible via `terraform apply`
- ✅ All resources documented with IaC
- ✅ Cost visibility in Terraform outputs
- ⚠️ Monthly infrastructure cost: ~€91-98/month (acceptable for now)

### Cost Breakdown (Documented in Terraform)

| Service                    | SKU/Tier         | Monthly Cost |
| -------------------------- | ---------------- | ------------ |
| PostgreSQL Flexible Server | B_Standard_B1ms  | ~€15         |
| Azure Cache for Redis      | Basic C0 (250MB) | ~€59         |
| Container Registry         | Basic            | ~€5          |
| Storage Account            | Standard_LRS     | ~€1-2        |
| Container Apps             | Consumption      | ~€5-10       |
| Application Insights       | Pay-as-you-go    | ~€5          |
| Key Vault                  | Standard         | ~€1          |
| **TOTAL (excl. OpenAI)**   |                  | **~€91-98**  |

### Future Cost Optimization Target (2027-2028)

Target: **~€40-50/month** by migrating Redis to Upstash or self-hosted option.

---

## Rollback Plan

N/A - No migration was performed. If Terraform breaks existing infrastructure:

1. **Immediate**: Resources still exist and function (Terraform doesn't destroy without explicit command)
2. **30 minutes**: Restore from Azure Portal if needed
3. **Post-mortem**: Document what went wrong, fix Terraform configuration

---

## Alternatives Considered

### 1. Migrate to Azure Managed Redis NOW

**Pros**: Modern Redis 7.2+, better features  
**Cons**:

- €200-300/month (4-6X more expensive)
- Overkill for student project
- Not cost-effective

**Rejected**: Cost prohibitive for project scope

### 2. Keep Azure Cache for Redis + No IaC

**Pros**: Zero effort  
**Cons**:

- Manual deployments error-prone
- No version control
- Hard to reproduce environments

**Rejected**: IaC is valuable learning and improves project quality

### 3. Migrate to Upstash Redis NOW

**Pros**: €5-15/month, modern Redis  
**Cons**:

- Outside Azure (integration complexity)
- Need to test thoroughly
- Can do this later if needed

**Deferred**: Good option but not urgent. Can migrate in 2027 before retirement.

### 4. Remove Redis Entirely (Use PostgreSQL for Queues)

**Pros**: One less service to manage  
**Cons**:

- PostgreSQL not optimized for job queues
- BullMQ requires Redis
- Would need to rewrite worker architecture

**Rejected**: Too much refactoring for minimal gain

---

## Key Lessons Learned

1. **Always Verify Costs Before Migrating**: Azure Managed Redis sounded cheaper but was actually 4X more expensive
2. **"New" Doesn't Mean "Better for You"**: Enterprise features are great but not worth 6X cost increase
3. **IaC Has Value Beyond Migrations**: Even without migration, Terraform improves project significantly
4. **Don't Over-Optimize Prematurely**: Current setup works; optimize when it becomes a real problem (2028)

---

## References

- [Azure Cache for Redis Retirement Announcement](https://learn.microsoft.com/azure/azure-cache-for-redis/cache-whats-new#october-2025)
- [Azure Managed Redis Pricing](https://azure.microsoft.com/pricing/details/cache/) - Enterprise tier pricing
- [Upstash Redis](https://upstash.com/pricing) - Serverless Redis alternative
- [Terraform AzureRM Provider - Redis Cache](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/redis_cache)
- [OpenTofu Documentation](https://opentofu.org/docs/) - Open source Terraform alternative

---

## Timeline

- **2026-02-06**: Decision made to keep current Redis + implement IaC
- **2026-02-06**: Terraform configuration completed
- **2027-Q3**: Evaluate migration options (Upstash vs self-hosted vs Azure alternatives)
- **2028-Q2**: Execute migration before September 30, 2028 retirement deadline

---

## Approval

**Student**: Carlos Jimenez  
**Mentor**: Senior Architect (GDE/MVP)  
**Date**: 2026-02-06  
**Status**: ✅ Approved - Keep current setup, implement IaC, defer Redis migration decision

---

**Next Review**: Q3 2027 (1 year before retirement) to finalize migration strategy
