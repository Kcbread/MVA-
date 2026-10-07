// One-time, scope-aware mechanical migration. Not a build step: edit src afterwards.
const fs = require('node:fs');
const path = require('node:path');
const acorn = require('acorn');
const walk = require('acorn-walk');
const scope = require('eslint-scope');
const root = path.resolve(__dirname, '..');
const input = process.argv[2];
if (!input) throw new Error('Supply explicit backup source path. Never re-extract over maintained src.');
const srcRoot = path.join(root, 'src');
if (fs.existsSync(srcRoot)) throw new Error('src already exists; refusing to overwrite maintained modules.');
const source = fs.readFileSync(path.resolve(input), 'utf8');
const ast = acorn.parse(source, { ecmaVersion: 'latest', sourceType: 'script', ranges: true, locations: true });
const scopes = scope.analyze(ast, { ecmaVersion: 2022, sourceType: 'script', optimistic: true, ignoreEval: true });

// Boundaries follow existing business operations, never arbitrary line counts.
const boundaries = [
  [1,'projects/config'],[83,'demand/intent'],[108,'projects/config'],
  [282,'catalog/taxonomy'],[416,'materials/identity'],[446,'session/config'],[527,'shell/navigation'],
  [736,'approval/navigation'],[768,'shell/navigation'],[874,'session/config'],[885,'om/assignment'],
  [912,'workflow/status-constants'],[950,'admin/permissions'],[1006,'admin/state'],
  [1126,'workflow/status-constants'],[1139,'sourcing/config'],[1170,'om/ownership'],
  [1200,'sourcing/config'],[1208,'shell/state'],
  [1343,'session/persona'],[1495,'shell/dialogs'],[1531,'data/purchase-records'],
  [1535,'shared/format'],[1556,'data/purchase-records'],[1637,'catalog/records'],
  [1696,'materials/display'],[1717,'materials/standard-names'],[1813,'materials/identity'],
  [2035,'demand/baselines'],[2131,'session/permissions'],[2163,'admin/audit'],
  [2181,'infrastructure/api'],[2209,'catalog/taxonomy'],[2243,'infrastructure/attachments'],
  [2281,'session/session'],[2313,'om/assignment'],[2454,'om/hydration'],
  [2614,'approval/hydration'],[2701,'om/navigation'],[2761,'session/session'],
  [2836,'cost/currency'],[2882,'infrastructure/module-adapters'],[2914,'workflow/status-view'],
  [2969,'progress/dashboard'],[3412,'admin/permissions'],[3443,'cost/currency'],
  [3492,'shared/format'],[3496,'projects/dates'],[3525,'om/tracking-rules'],
  [3538,'shared/format'],[3551,'om/quote-validity'],[3589,'demand/quantity'],
  [3612,'inventory/suggestions'],[3628,'catalog/context'],[3736,'inventory/suggestions'],
  [3919,'demand/quantity'],[4048,'materials/display'],[4082,'handoff/status'],
  [4115,'om/ownership'],[4341,'om/pas-rules'],[4356,'approval/routing'],
  [4363,'projects/config'],[4463,'projects/controls'],[4484,'projects/calendar'],
  [4555,'projects/dates'],[4601,'projects/controls'],[4724,'catalog/taxonomy'],
  [4751,'demand/request-fields'],[4822,'projects/config'],[4834,'cost/demand-metrics'],
  [5007,'cost/stage-view'],[5087,'demand/matrix-view'],[5275,'cost/stage-view'],
  [5474,'cost/quantity-filters'],[5627,'cost/quantity-dashboard'],[5748,'shared/html'],
  [5760,'cost/quantity-dashboard'],[5870,'cost/dashboard-data'],[5992,'approval/quantity-scope'],
  [6171,'inventory/cost-evidence'],[6249,'cost/dashboard-values'],[6422,'inventory/cost-evidence'],
  [6444,'cost/dashboard-view'],[6486,'inventory/cost-evidence'],[6571,'cost/dashboard-view'],
  [6732,'approval/analysis-scope'],[7093,'shared/dom'],[7114,'projects/review-context'],
  [7204,'approval/analysis-view'],[7491,'cost/dashboard-view'],[7652,'cost/matrix-data'],
  [8043,'approval/quantity-review'],[8703,'cost/matrix-view'],[9060,'cost/stage-view'],
  [9064,'projects/setup'],[9151,'shell/navigation'],[9255,'catalog/context'],[9275,'shell/navigation'],
  [9365,'demand/records'],[9488,'materials/demand-conversion'],[9572,'data/demo-seeds'],
  [10126,'demand/workspace'],[10146,'inventory/warehouse'],[10688,'catalog/natural-search-view'],
  [10717,'demand/selected-lines'],[10820,'demand/worksheet-view'],[10958,'shell/table-navigation'],
  [11018,'demand/worksheet'],[11268,'catalog/search'],[11670,'demand/worksheet-actions'],
  [11860,'session/contacts'],[11979,'demand/editor'],[12404,'catalog/history-view'],
  [12578,'demand/amendments'],[13128,'shared/dates'],[13167,'workflow/timeline'],
  [13238,'demand/submission-view'],[13372,'approval/audit-view'],[13583,'catalog/search-actions'],
  [13684,'catalog/add-actions'],[13744,'materials/maintenance'],[13807,'catalog/reuse'],
  [13988,'demand/drafts'],[14051,'demand/submit'],[14177,'materials/maintenance'],
  [14197,'demand/request-fields'],[14215,'materials/new-item'],[14395,'materials/entry-view'],
  [14490,'catalog/match'],[14548,'materials/entry-view'],[14614,'materials/standard-picker'],
  [14681,'materials/batch'],[14791,'materials/new-item'],[14884,'approval/queues'],
  [15034,'approval/viewport'],[15073,'approval/queue-view'],[15430,'progress/demand'],
  [15854,'om/progress-data'],[16402,'cost/exchange-rate-view'],[16430,'projects/calendar-view'],
  [16543,'cost/exchange-rate-view'],[16567,'om/progress-view'],[16721,'om/leader-data'],
  [16849,'om/progress-view'],[17087,'shared/detail-view'],[17116,'approval/manager-view'],
  [17170,'cost/pricing'],[17230,'materials/detail-view'],[17645,'sourcing/package-view'],
  [17680,'cost/detail-view'],[17965,'approval/routing'],[18015,'cost/manager-dashboard'],
  [18089,'handoff/queue'],[18110,'om/assignment'],[18246,'om/pas-view'],
  [18452,'om/quote-view'],[18645,'om/pas-view'],[18701,'om/pas-actions'],
  [18740,'handoff/queue'],[18785,'handoff/view'],[18939,'sourcing/rfq'],
  [19295,'handoff/buyer'],[19410,'sourcing/rfq-actions'],[19735,'handoff/actions'],
  [19775,'om/filters'],[19795,'om/export-rules'],[19947,'om/queue'],
  [20078,'om/history'],[20136,'om/external-progress'],[20304,'om/pricing'],
  [20345,'infrastructure/module-adapters'],[20369,'cost/price-decision'],
  [20615,'om/quote-rules'],[20687,'om/export-rules'],[20737,'om/workspace'],
  [20795,'om/quotation-db'],[20904,'om/tracking-view'],[21006,'om/tracking-actions'],
  [21055,'om/export-view'],[21116,'om/quote-view'],[21305,'cost/actual-buy'],
  [21441,'demand/baseline-setup'],[21507,'om/history'],[21526,'om/quote-actions'],
  [21617,'om/selection'],[21642,'om/quote-actions'],[21820,'om/pas-actions'],
  [21942,'demand/quote-confirmation'],[22152,'om/export-actions'],
  [22272,'approval/status'],[22556,'approval/price-review'],[22994,'approval/decisions'],
  [23323,'admin/setup'],[23516,'admin/import-view'],[23637,'admin/setup'],
  [24154,'exports/pas'],[24309,'om/external-progress'],[24455,'om/row-actions'],
  [24515,'exports/om'],[24757,'handoff/actions'],[24790,'exports/workbook'],
  [25068,'exports/handoff'],[25134,'shell/events'],[25180,'shell/dialogs'],
  [25199,'shell/events'],[26422,'bootstrap/startup'],[26433,'session/login-enhancer'],
  [26838,'bootstrap/startup'],[26840,'cost/budget-cleanup'],[26878,'cost/budget-enhancer'],
];
function ownerAt(line) { return boundaries.filter(([start]) => start <= line).at(-1)[1]; }
function stateOwner(name, fallback) {
  if (/^(currentRole|currentUserRole|currentSessionUser|apiSessionReady|currentRequesterPersonaId)$/.test(name)) return 'session/state';
  if (/^(currentView|currentDeptTab|currentManagerTab|currentHandoffTab|currentPriceReviewTab|currentPriceReviewQueue)$/.test(name)) return 'shell/state';
  if (/^currentProject/.test(name) || name === 'PROJECTS') return 'projects/state';
  if (/^(requestItemPicker|requestCatalogApi|itemPicker|searchResults|naturalSearchActive|historyResults|historySearchActive|historySelections|currentReuseMode)/.test(name)) return 'catalog/state';
  if (/^(requestWorksheet|restoredRequester|requestSequence|requests$|currentDeptDemand|lastRequest|lastDemandType|activeDemandRequestId|expandedDemandEditor)/.test(name)) return 'demand/state';
  if (/^(newItem|masterSequence|materialSequence|materialMasterRecords|pendingMaterial|pendingStandard|standardPicker|batchMaterial|activeBatchMaterial|selectedNewItem)/.test(name)) return 'materials/state';
  if (/^(selectedManager|selectedPriceReview|priceReviewAnalysisRows|shouldScrollPriceReview|activeItemQuantity|approvalQuantity|approvalViewport|currentDemandAnalysisTab|expandedManagerQuantity)/.test(name)) return 'approval/state';
  if (/^(omAssignees|omAssignment|selectedOm|currentOm|omSelections|omHistory|omLeaderConsole|omProjectStage|pendingOm|pendingExternal)/.test(name)) return 'om/state';
  if (/^(currencyDisplay|monthlyExchangeRates)/.test(name)) return 'cost/state';
  if (/^(warehouse|currentWarehouse)/.test(name)) return 'inventory/state';
  if (/^(handoffHistory|dispatchHistory|externalProgressSequence)/.test(name)) return 'handoff/state';
  if (/^(purchaseRecords|vendorMaterialMappings|demandBaselines|actualBuyRecords)/.test(name)) return 'data/state';
  if (/^(toastSequence|pendingConfirmAction)/.test(name)) return 'shell/dialogs';
  if (name === 'selectedProjectStatusScope') return 'progress/state';
  if (name === 'pendingRfqEmailRows') return 'sourcing/state';
  return fallback;
}
const units = ast.body.map((node, index) => ({ node, index, owner: ownerAt(node.loc.start.line) }));
// Declarations have one owner even where the legacy state block mixed business areas.
for (const u of units) if (u.node.type === 'VariableDeclaration') {
  if (u.node.declarations.length !== 1 || u.node.declarations[0].id.type !== 'Identifier') throw new Error('Review multi/pattern declaration '+u.node.loc.start.line);
  u.owner = stateOwner(u.node.declarations[0].id.name, u.owner);
}
const variables = new Map();
for (const v of scopes.globalScope.variables) {
  const def = v.defs[0];
  if (!def) continue;
  const u = units.find(u => def.name.start >= u.node.start && def.name.end <= u.node.end);
  if (!u) throw new Error('Unowned '+v.name);
  variables.set(v.name, { name:v.name, owner:u.owner, unit:u, kind:u.node.type === 'FunctionDeclaration' ? 'function' : u.node.kind, refs:v.references });
}
const refs = new Map();
for (const v of variables.values()) for (const r of v.refs) refs.set(r.identifier.start, v);
const modules = new Map();
function mod(owner) { if (!modules.has(owner)) modules.set(owner,{ imports:new Map(), chunks:[], setters:new Set(), advances:new Set(), exports:new Set() }); return modules.get(owner); }
function use(owner, target, name) { if (owner === target) return; const m=mod(owner); if(!m.imports.has(target))m.imports.set(target,new Set());m.imports.get(target).add(name); }
const capitalize = n => n[0].toUpperCase()+n.slice(1);
const setter = n => 'replace'+capitalize(n)+'Binding';
const advance = n => 'advance'+capitalize(n)+'Binding';
function render(u, start=u.node.start, end=u.node.end) {
  const mutations = [];
  walk.fullAncestor(u.node,(node, _s, ancestors) => {
    if(node.start < start || node.end > end) return;
    if(node.type === 'Identifier') { const v=refs.get(node.start); if(v) use(u.owner,v.owner,v.name); }
    if(node.type === 'AssignmentExpression' && node.left.type === 'Identifier') {
      const v=refs.get(node.left.start);
      if(v && v.owner !== u.owner) {
        mod(v.owner).setters.add(v.name);use(u.owner,v.owner,setter(v.name));
        mutations.push({node,build:r => {
          const rhs=r(node.right.start,node.right.end);
          if(node.operator==='=')return `${setter(v.name)}(${rhs})`;
          const op=node.operator.slice(0,-1);
          if(['&&','||','??'].includes(op))return `(${v.name} ${op} ${setter(v.name)}(${rhs}))`;
          return `${setter(v.name)}(${v.name} ${op} (${rhs}))`;
        }});
      }
    }
    if(node.type === 'UpdateExpression' && node.argument.type === 'Identifier') {
      const v=refs.get(node.argument.start);
      if(v && v.owner !== u.owner) {
        mod(v.owner).advances.add(v.name);use(u.owner,v.owner,advance(v.name));
        mutations.push({node,build:()=>`${advance(v.name)}(${node.operator==='++'?1:-1}, ${!node.prefix})`});
      }
    }
  });
  function piece(a,b,exclude) {
    const available=mutations.filter(x=>x!==exclude && x.node.start>=a && x.node.end<=b).sort((x,y)=>x.node.start-y.node.start || y.node.end-x.node.end);
    let out='',cursor=a;
    for(const m of available){if(m.node.start<cursor)continue;out+=source.slice(cursor,m.node.start)+m.build((s,e)=>piece(s,e,m));cursor=m.node.end;}
    return out+source.slice(cursor,b);
  }
  return piece(start,end);
}
const startup=[];
const manifest=[];
for(const u of units){
  const n=u.node,m=mod(u.owner);let code;
  if(n.type==='FunctionDeclaration'){
    code='export '+render(u);m.exports.add(n.id.name);
  } else if(n.type==='VariableDeclaration'){
    const d=n.declarations[0],name=d.id.name,init='initialize'+capitalize(name)+'Binding';
    code=`export let ${name};\nexport function ${init}() {\n  ${name} = ${d.init?render(u,d.init.start,d.init.end):'undefined'};\n}`;
    m.exports.add(name);m.exports.add(init);startup.push({owner:u.owner,call:init+'();',index:u.index});
  } else {
    const action='initializeStep'+String(u.index).padStart(4,'0');
    code=`export function ${action}() {\n${render(u)}\n}`;m.exports.add(action);startup.push({owner:u.owner,call:action+'();',index:u.index});
  }
  m.chunks.push(`// @legacy-unit ${u.index} ${n.loc.start.line}\n${code}\n// @end-legacy-unit ${u.index}`);
  manifest.push({index:u.index,line:n.loc.start.line,endLine:n.loc.end.line,type:n.type,name:n.id?.name||n.declarations?.[0]?.id.name||null,kind:n.kind||null,module:u.owner+'.js'});
}
// Stable, live compatibility for existing browser extensions and test integrations.
// New modules never consume this adapter: they use static imports.
const bridge=[];
const legacyNames = new Set(`currentProject currentRole requests currentRequesterPersonaId selectedProjectStatusScope approvalQuantityReviewTab apiModeEnabled apiRequest DEMAND_TYPE_MFG EXT_REJECTED_DRI PRICE_ESCALATION_PENDING_PROJECT_DRI PRICE_ESCALATION_REQUIRED activeProjectContext addWorksheetRow amountVndFromUsd applyCostManagerAuthorization applyPriceReviewDecision applyRole approvalPipelineStatus approvalQuantityMatrixRows canOperateOmRow closeDemandEditor closeItemDetail commitExternalResult confirmOmQuoteResultRows confirmUserAOmQuote createNewItemSuggestion createStationBreakdownEntry createUserAAmendmentDraft currentUserRole deptDriSubmissionReviewPatch historyPackageKey hydrateOmLeaderConsoleRows itemMatchHighlight itemNameMatchRank managerCarryoverCostSaving managerDemandCostRows managerQuantityGroups materialEntryRow needConfirmationRows newItemSuggestions normalizeRequestDemandDepartment omSubmissionRows openRequestItemPicker persistRequesterLocalDrafts priceReviewSelectedRowScope projectContextRowsForProject projectStatusScopeFromRow readRequesterLocalDrafts removeRequest renderDepartment renderItemDetail renderManager renderProjectStatus requestFromRecord requestItemPickerSources requestWorksheetColumns requestWorksheetMergedSources requestWorksheetRows requestWorksheetSourceHaystack requesterLocalDraftKey requesterPersonas requesterPickerSpec reusableHistoryRows roleReviewRows saveOmQuoteInfoRows saveRequesterDraft selectedManagerRequestId selectedPriceReviewProjectContext selectedPriceReviewRequestId sendOmPasRowsToUserConfirm setDeptTab setManagerTab setOmTab setPriceReviewTab setScreen setView submitRequests syncRowPhaseQtyFromStationBreakdown updateRequestWorksheetQty userCarryoverUnitPriceVnd`.split(/\s+/));
walk.simple(ast,{MemberExpression(n){if(n.object.type==='Identifier'&&['window','globalThis'].includes(n.object.name)&&!n.computed&&variables.has(n.property.name))legacyNames.add(n.property.name);}});
for(const v of variables.values()){
  if(!legacyNames.has(v.name))continue;
  use('compat/legacy-global',v.owner,v.name);
  const writable=v.kind!=='const';
  if(writable){mod(v.owner).setters.add(v.name);use('compat/legacy-global',v.owner,setter(v.name));}
  bridge.push(`  ${JSON.stringify(v.name)}: { configurable: true, get: () => ${v.name}${writable?`, set: ${setter(v.name)}`:''} },`);
}
mod('compat/legacy-global').chunks.push(`// Compatibility boundary only. No domain module depends on window state.\nexport function installLegacyGlobals(target = globalThis) {\n Object.defineProperties(target, {\n${bridge.join('\n')}\n });\n}`);
mod('compat/legacy-global').exports.add('installLegacyGlobals');
const boot=mod('bootstrap/initialize');
for(const s of startup)use('bootstrap/initialize',s.owner,s.call.slice(0,-3));
boot.chunks.push(`// Preserve seed, state, listener and initial-render sequencing.\nexport function initializeApplication() {\n${startup.map(s=>'  '+s.call).join('\n')}\n}`);
for(const [owner,m] of modules){
  for(const name of m.setters){m.chunks.push(`export function ${setter(name)}(value) { ${name} = value; return value; }`);m.exports.add(setter(name));}
  for(const name of m.advances){m.chunks.push(`export function ${advance(name)}(delta, postfix) {\n  if (delta === 1) return postfix ? ${name}++ : ++${name};\n  return postfix ? ${name}-- : --${name};\n}`);m.exports.add(advance(name));}
  const imports=[...m.imports].sort(([a],[b])=>a.localeCompare(b)).map(([target,names])=>{
    let rel=path.posix.relative(path.posix.dirname(owner),target)+'.js';if(!rel.startsWith('.'))rel='./'+rel;
    return `import {\n  ${[...names].sort().join(',\n  ')}\n} from ${JSON.stringify(rel)};`;
  });
  const file=path.join(srcRoot,owner+'.js');fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(file,`// ${owner}: authoritative source; see docs/module-map.md.\n${imports.join('\n')}\n\n${m.chunks.join('\n\n')}\n`);
}
fs.writeFileSync(path.join(srcRoot,'package.json'),JSON.stringify({type:'module'},null,2)+'\n');
fs.writeFileSync(path.join(srcRoot,'module-manifest.json'),JSON.stringify({source:'app.js before 2026-09-09 modularization',units:manifest,modules:[...modules].map(([name,m])=>({name:name+'.js',imports:[...m.imports.keys()].sort(),exports:[...m.exports].sort()}))},null,2)+'\n');
console.log(JSON.stringify({modules:modules.size,functions:variables.size,units:units.length,startupSteps:startup.length}));
