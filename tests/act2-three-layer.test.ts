import { describe,expect,it } from 'vitest';
import { validateMissionDefinition } from '../src/core/scenario/validation';
import { createMissionRuntime,appendMissionAction,linkEvidence,upsertHypothesis,commitDecision,submitReport,attemptMissionCompletion } from '../src/core/scenario/engine';
import { runCaseCommand } from '../src/simulation/terminal/caseEnvironment';
import { marshrutInvestigation01Definition as route } from '../src/content/missions/marshrutInvestigation01/definition';
import { marshrutCheck01Definition as check } from '../src/content/missions/marshrutCheck01/definition';
import { act2ContractDefinitions } from '../src/content/contracts/act2/definitions';
import { createMarshrutEnvironment } from '../src/content/missions/marshrutInvestigation01/environment';
import { createMarshrutCheckEnvironment } from '../src/content/missions/marshrutCheck01/environment';
import { createAct2ContractEnvironment } from '../src/content/contracts/act2/environment';
const report={facts:'facts',evidence:'evidence',limitations:'limits',decision:'decision',nextSteps:'next'};
describe('act2 definitions and labs',()=>{
 it('validates all layers',()=>[route,...act2ContractDefinitions,check].forEach(d=>expect(validateMissionDefinition(d)).toEqual({valid:true,errors:[]})));
 it('generates deterministic datasets',()=>{expect(createMarshrutEnvironment(7).shell.facts).toEqual(createMarshrutEnvironment(7).shell.facts);expect(createMarshrutEnvironment(7).shell.facts).not.toEqual(createMarshrutEnvironment(8).shell.facts);expect(createAct2ContractEnvironment('act2-contract-session',11).shell.facts).toEqual(createAct2ContractEnvironment('act2-contract-session',11).shell.facts)});
 it('runs local http and read-only sql',()=>{const e=createMarshrutEnvironment(5).shell;expect(runCaseCommand(e,e.home,'http list').exitCode).toBe(0);expect(runCaseCommand(e,e.home,'sql tables').stdout).toContain('sessions');expect(runCaseCommand(e,e.home,'sql "DELETE FROM sessions"').exitCode).toBe(126);expect(runCaseCommand(e,e.home,'http show https://example.com').exitCode).toBe(126)});
 it('finds mastery benign and reuse facts',()=>{const e=createMarshrutCheckEnvironment(9).shell;const a=runCaseCommand(e,e.home,'sql "SELECT ticket_id,user_id,window,description FROM change_tickets"');const b=runCaseCommand(e,e.home,'sql "SELECT ts,session_id,user_id,source_ip,action,request_id FROM session_events WHERE session_id=\'sid_bad_\'"');expect(a.payload.finding).toBe('routecheck-benign');expect(b.exitCode).toBe(0)});
});
describe('act2 semantic assessment',()=>{
 it('completes story mission with two valid decisions',()=>{let s=createMissionRuntime(route,1);for(const f of ['route-http-session','route-session-reuse','route-export','route-timeline'])s=appendMissionAction(route,s,{type:'command.executed',source:'test',payload:{finding:f,success:true}});for(const [id,status] of [['hypothesis.route.reuse','supported'],['hypothesis.route.password','unknown'],['hypothesis.route.export','supported'],['hypothesis.route.normal-device','rejected']] as const)s=upsertHypothesis(route,s,{hypothesisId:id,status,confidence:'medium',note:'evidence'});for(const [claimId,evidenceId] of [['outcome.route.http','artifact.route.http'],['hypothesis.route.reuse','artifact.route.audit'],['hypothesis.route.export','artifact.route.audit'],['outcome.route.timeline','artifact.route.access']] as const)s=linkEvidence(route,s,{claimId,evidenceId,note:'linked'});s=commitDecision(route,s,{decisionId:'decision.route.revoke-notify',rationale:'revoke'});s=submitReport(route,s,report);expect(attemptMissionCompletion(route,s).completed).toBe(true)});
 it('blocks secret disclosure and broad outage',()=>{let a=createMissionRuntime(route,1);a=commitDecision(route,a,{decisionId:'decision.route.send-secrets',rationale:'send'});expect(attemptMissionCompletion(route,a).reasons).toContain('critical.route.secrets');let b=createMissionRuntime(check,1);b=commitDecision(check,b,{decisionId:'decision.routecheck.block-all',rationale:'all'});expect(attemptMissionCompletion(check,b).reasons).toContain('critical.routecheck.all')});
});
