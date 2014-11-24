/*global execution, companyhome, logger, utils, cnrutils, use, search, task, actions, bpm_workflowDescription, wfcnr_wfCounterId, bpm_package, bpm_comment, bpm_assignee, bpm_groupAssignee, bpm_workflowDueDate, bpm_workflowPriority, initiator, people, wfCommon,wfvarNomeFlusso, arubaSign */
var wfFlussoAttestati = (function () {
  "use strict";
  //Variabili Globali
  //var nomeFlusso = "AUTORIZZAZIONI DSFTM";
  var DEBUG = true;

  function logHandler(testo) {
    if (DEBUG) {
      logger.error(testo);
    }
  }

  function setNomeFlusso() {
    execution.setVariable('wfvarNomeFlusso', 'FLUSSO ATTESTATI');
    execution.setVariable('wfvarTitoloFlusso', 'FLUSSO_ATTESTATI');
    logHandler("wfFlussoAttestati.js -- wfvarNomeFlusso: " + execution.getVariable('wfvarNomeFlusso'));
  }

  function setProcessVarIntoTask() {
    logHandler("wfFlussoAttestati.js -- setProcessVarIntoTask");
    if (bpm_workflowDueDate !== undefined && bpm_workflowDueDate !== null) {
      task.dueDate = bpm_workflowDueDate;
    }
    if (bpm_workflowPriority !== undefined && bpm_workflowPriority !== null) {
      task.priority = bpm_workflowPriority;
    }
    if (bpm_comment !== undefined && bpm_comment !== null) {
      task.setVariable('bpm_comment', bpm_comment);
    }
    logHandler("wfFlussoAttestati.js -- set bpm_workflowDueDate " +  bpm_workflowDueDate + " bpm_workflowPriority: " + bpm_workflowPriority + " bpm_comment: " + bpm_comment);
  }

  function settaGruppi() {
    logHandler("wfFlussoAttestati.js -- settaGruppi");
    execution.setVariable('wfvarResponsabiliATTESTATI', 'GROUP_RESPONSABILI_ATTESTATI');
  }

  function settaDocAspects(nodoDoc) {
    if (nodoDoc.hasAspect('wfcnr:parametriFlusso')) {
      logHandler("wfCommon.js - settaDocAspects - Il documento: " + nodoDoc.name + " risulta gia' con aspect parametriFlusso");
    } else {
      nodoDoc.addAspect("wfcnr:parametriFlusso");
      logHandler("wfCommon.js - settaDocAspects - Il documento: " + nodoDoc.name + " risulta ora con aspect parametriFlusso");
    }
    if (nodoDoc.hasAspect('wfcnr:signable')) {
      logHandler("wfCommon.js - settaDocAspects - Il documento: " + nodoDoc.name + " risulta gia' con aspect signable");
    } else {
      nodoDoc.addAspect("wfcnr:signable");
      logHandler("wfCommon.js - settaDocAspects - Il documento: " + nodoDoc.name + " risulta ora con aspect signable");
    }
    if (nodoDoc.hasAspect('cnrattestati:parametriAttestati')) {
      logHandler("wfCommon.js - settaDocAspects - Il documento: " + nodoDoc.name + " risulta gia' con aspect parametriAttestati");
    } else {
      nodoDoc.addAspect("cnrattestati:parametriAttestati");
      logHandler("wfCommon.js - settaDocAspects - Il documento: " + nodoDoc.name + " risulta ora con aspect parametriAttestati");
    }
  }


  function settaStartProperties(nodoDoc) {
    var workflowPriority, utenteRichiedente;
    logHandler("wfFlussoAttestati.js -- settaStartProperties");
    workflowPriority = execution.getVariable('bpm_workflowPriority');
    if (bpm_workflowPriority === 'undefined') {
      execution.setVariable('bpm_workflowPriority', 3);
    }
    if ((execution.getVariable('bpm_dueDate') !== null) && (execution.getVariable('bpm_dueDate') !== undefined)) {
      execution.setVariable('bpm_dueDate', execution.getVariable('bpm_workflowDueDate'));
    }
    logHandler("wfFlussoDSFTM.js -- get bpm_dueDate: " + execution.getVariable('bpm_dueDate'));
    if ((execution.getVariable('cnrattestati_userNameRichiedente') !== null) && (execution.getVariable('cnrattestati_userNameRichiedente') !== undefined)) {
      utenteRichiedente = people.getPerson(execution.getVariable('cnrattestati_userNameRichiedente'));
      if ((utenteRichiedente.properties.email !== null) && (utenteRichiedente.properties.email !== undefined)) {
        logHandler("wfFlussoDSFTM.js -- utenteRichiedente: " + utenteRichiedente.properties.userName);
        execution.setVariable('wfvarUtenteRichiedente', utenteRichiedente.properties.userName);
        nodoDoc.properties["cnrattestati:userNameRichiedente"] = utenteRichiedente.properties.userName;
        if ((execution.getVariable('cnrattestati_codiceSede') !== null) && (execution.getVariable('cnrattestati_codiceSede') !== undefined)) {
          nodoDoc.properties["cnrattestati:codiceSede"] = execution.getVariable('cnrattestati_codiceSede');
        }
        if ((execution.getVariable('cnrattestati_annoAttestato') !== null) && (execution.getVariable('cnrattestati_annoAttestato') !== undefined)) {
          nodoDoc.properties["cnrattestati:annoAttestato"] = execution.getVariable('cnrattestati_annoAttestato');
        }
        if ((execution.getVariable('cnrattestati_meseAttestato') !== null) && (execution.getVariable('cnrattestati_meseAttestato') !== undefined)) {
          nodoDoc.properties["cnrattestati:meseAttestato"] = execution.getVariable('cnrattestati_meseAttestato');
        }
        nodoDoc.save();
        logHandler("wfFlussoDSFTM.js - Metadati ATTESTATI - userNameRichiedente " + execution.getVariable('cnrattestati_userNameRichiedente') + " codiceSede " + execution.getVariable('cnrattestati_codiceSede') + " annoAttestato " + execution.getVariable('cnrattestati_annoAttestato') + " meseAttestato " + execution.getVariable('cnrattestati_meseAttestato'));
      } else {
        logHandler("wfFlussoDSFTM.js - CONTROLLO FLUSSO - L'UTENTE RICHIEDENTE " + execution.getVariable('cnrattestati_userNameRichiedente') + " INDICATO RISULTA SPROVVISTO DI E-MAIL");
        throw new Error("L'UTENTE RICHIEDENTE INDICATO RISULTA SPROVVISTO DI E-MAIL");
      }
    } else {
      logHandler("wfFlussoDSFTM.js - CONTROLLO FLUSSO - L'UTENTE RICHIEDENTE INDICATO RISULTA NON VALIDO");
      throw new Error("L'UTENTE RICHIEDENTE INDICATO RISULTA NON VALIDO");
    }
  }


  function flussoAttestatiSartSettings() {
    logHandler("wfFlussoAttestati.js -- flussoAttestatiSartSettings");
    //SET GRUPPI
    settaGruppi();
    settaDocAspects(bpm_package.children[0]);
    settaStartProperties(bpm_package.children[0]);
    wfCommon.settaDocPrincipale(bpm_package.children[0]);
  }

  function notificaMailGruppo(gruppoDestinatariMail, tipologiaNotifica) {
    var members, testo, isWorkflowPooled, destinatario, i;
    logHandler("wfFlussoAttestati.js -- notificaMail");
    members = people.getMembers(gruppoDestinatariMail);
    testo = "Notifica di scadenza di un flusso documentale";
    isWorkflowPooled = true;
    logHandler("FLUSSO ATTESTATI - invia notifica ai membri del gruppo: " + gruppoDestinatariMail.properties.authorityName);
    for (i = 0; i < members.length; i++) {
      destinatario = members[i];
      logHandler("FLUSSO ATTESTATI - invia notifica a : " + destinatario.properties.userName + " del gruppo: " + gruppoDestinatariMail.properties.authorityName);
      wfCommon.inviaNotifica(destinatario, testo, isWorkflowPooled, gruppoDestinatariMail, execution.getVariable('wfvarNomeFlusso'), tipologiaNotifica);
    }
  }

  function notificaMailSingolo(destinatario, tipologiaNotifica) {
    var testo, isWorkflowPooled, gruppoDestinatariMail;
    logHandler("wfFlussoAttestati.js -- notificaMail");
    isWorkflowPooled = false;
    gruppoDestinatariMail = "GENERICO";
    testo = "Notifica di scadenza di un flusso documentale";
    logHandler("FLUSSO ATTESTATI - invia notifica a : " + destinatario.properties.userName);
    wfCommon.inviaNotifica(destinatario, testo, isWorkflowPooled, gruppoDestinatariMail, execution.getVariable('wfvarNomeFlusso'), tipologiaNotifica);
  }

  function setPermessiValidazione(nodoDocumento) {
    wfCommon.eliminaPermessi(nodoDocumento);
    if (people.getGroup(execution.getVariable('wfvarResponsabiliATTESTATI'))) {
      nodoDocumento.setPermission("Consumer", execution.getVariable('wfvarResponsabiliATTESTATI'));
      logHandler("wfFlussoAttestati.js -- setPermessiValidazione con wfvarResponsabiliATTESTATI: " + execution.getVariable('wfvarResponsabiliATTESTATI'));
    }
    if (execution.getVariable('wfvarUtenteFirmatario')) {
      logHandler("wfFlussoAttestati.js -- setPermessiValidazione con wfvarUtenteFirmatario: " + execution.getVariable('wfvarUtenteFirmatario'));
      nodoDocumento.setPermission("Consumer", execution.getVariable('wfvarUtenteFirmatario'));
    }
  }

  function setPermessiRespinto(nodoDocumento) {
    wfCommon.eliminaPermessi(nodoDocumento);
    if (people.getGroup(execution.getVariable('wfvarResponsabiliATTESTATI'))) {
      nodoDocumento.setPermission("Consumer", execution.getVariable('wfvarResponsabiliATTESTATI'));
      logHandler("wfFlussoAttestati.js -- setPermessiValidazione con wfvarResponsabiliATTESTATI: " + execution.getVariable('wfvarResponsabiliATTESTATI'));
    }
    if (execution.getVariable('wfvarUtenteRichiedente')) {
      logHandler("wfFlussoAttestati.js -- setPermessiValidazione con wfvarUtenteRichiedente: " + execution.getVariable('wfvarUtenteRichiedente'));
      nodoDocumento.setPermission("Editor", execution.getVariable('wfvarUtenteRichiedente'));
    }
  }

  function setPermessiEndflussoAttestati(nodoDocumento) {
    wfCommon.eliminaPermessi(nodoDocumento);
    if (people.getGroup(execution.getVariable('wfvarResponsabiliATTESTATI'))) {
      nodoDocumento.setPermission("Consumer", execution.getVariable('wfvarResponsabiliATTESTATI'));
      logHandler("wfFlussoAttestati.js -- setPermessiEndflussoAttestati con wfvarResponsabiliATTESTATI: " + execution.getVariable('wfvarResponsabiliATTESTATI'));
    }
    if (execution.getVariable('wfvarUtenteFirmatario')) {
      nodoDocumento.setPermission("Consumer", execution.getVariable('wfvarUtenteFirmatario'));
      logHandler("wfFlussoAttestati.js -- setPermessiEndflussoAttestati con wfvarUtenteFirmatario: " + people.getPerson(execution.getVariable('wfvarUtenteFirmatario')));
    }
    if (execution.getVariable('wfvarUtenteRichiedente')) {
      nodoDocumento.setPermission("Consumer", execution.getVariable('wfvarUtenteRichiedente'));
      logHandler("wfFlussoAttestati.js -- setPermessiEndflussoAttestati con wfvarUtenteRichiedente: " + execution.getVariable('wfvarUtenteRichiedente'));
    }
  }



  function validazione() {
    var nodoDoc, tipologiaNotifica;
    // --------------
    logHandler("wfFlussoAttestati.js -- get bpm_workflowDueDate: " + execution.getVariable('bpm_workflowDueDate'));
    logHandler("wfFlussoAttestati.js -- wfvarResponsabiliATTESTATI: " + execution.getVariable('wfvarResponsabiliATTESTATI'));
    logHandler("wfFlussoAttestati.js -- bpm_dueDate: " + task.getVariable('bpm_dueDate'));
    logHandler("wfFlussoAttestati.js -- bpm_priority: " + task.getVariable('bpm_priority'));
    logHandler("wfFlussoAttestati.js -- bpm_comment: " + task.getVariable('bpm_comment'));
    logHandler("wfFlussoAttestati.js -- bpm_assignee name: " + task.getVariable('bpm_assignee').properties.userName);
    execution.setVariable('wfvarUtenteFirmatario', task.getVariable('bpm_assignee').properties.userName);
    setProcessVarIntoTask();
    task.setVariable('bpm_percentComplete', 30);
    if ((bpm_package.children[0] !== null) && (bpm_package.children[0] !== undefined)) {
      nodoDoc = bpm_package.children[0];
      wfCommon.taskStepMajorVersion(nodoDoc);
      setPermessiValidazione(nodoDoc);
    }
    // INVIO NOTIFICA
    tipologiaNotifica = 'compitoAssegnato';
    if (people.getPerson(execution.getVariable('wfvarUtenteFirmatario'))) {
      notificaMailSingolo(people.getPerson(execution.getVariable('wfvarUtenteFirmatario')), tipologiaNotifica);
    }
  }

  function validazioneEnd() {
    logHandler("wfFlussoAttestati.js -- bpm_assignee: " + task.getVariable('bpm_assignee').properties.userName);
    logHandler("wfFlussoAttestati.js -- wfcnr_reviewOutcome: " + task.getVariable('wfcnr_reviewOutcome'));
    logHandler("wfFlussoAttestati.js -- bpm_comment: " + task.getVariable('bpm_comment'));
    execution.setVariable('wfcnr_reviewOutcome', task.getVariable('wfcnr_reviewOutcome'));
    execution.setVariable('wfvarCommento', task.getVariable('bpm_comment'));
  }

  function Approva() {
    var nodoDoc, statoFinale, formatoFirma, dataFirma, username, ufficioFirmatario, codiceDoc, commentoFirma;
    logHandler("wfFlussoAttestati.js -- Approva ");
    if ((bpm_package.children[0] !== null) && (bpm_package.children[0] !== undefined)) {
      nodoDoc = bpm_package.children[0];
      //nodoDoc.setPermission("Coordinator", execution.getVariable('wfvarUtenteFirmatario').properties["cm:userName"]);
      statoFinale = "APPROVATO";
      formatoFirma = "leggera";
      dataFirma = new Date();
      if (execution.getVariable('wfvarUtenteFirmatario')) {
        username = execution.getVariable('wfvarUtenteFirmatario');
      }
      commentoFirma = execution.getVariable('wfvarCommento');
      ufficioFirmatario = 'GENERICO';
      codiceDoc = execution.getVariable('wfcnr_codiceDocumentoUfficio');
      wfCommon.setMetadatiFirma(nodoDoc, formatoFirma, username, ufficioFirmatario, dataFirma, codiceDoc, commentoFirma);
      logHandler("wfFlussoAttestati.js -- approva: firma leggera ");
      wfCommon.taskEndMajorVersion(nodoDoc, statoFinale);
      setPermessiEndflussoAttestati(nodoDoc);
    }
  }

  function respinto() {
    var nodoDoc, statoFinale, formatoFirma, dataFirma, username, ufficioFirmatario, codiceDoc, commentoFirma, tipologiaNotifica;
    logHandler("wfFlussoAttestati.js -- Respingi ");
    if ((bpm_package.children[0] !== null) && (bpm_package.children[0] !== undefined)) {
      nodoDoc = bpm_package.children[0];
      statoFinale = "RESPINTO";
      formatoFirma = "non eseguita";
      dataFirma = new Date();
      if (execution.getVariable('wfvarUtenteFirmatario')) {
        username = execution.getVariable('wfvarUtenteFirmatario');
      }
      commentoFirma = execution.getVariable('wfvarCommento');
      ufficioFirmatario = 'GENERICO';
      codiceDoc = execution.getVariable('wfcnr_codiceDocumentoUfficio');
      wfCommon.setMetadatiFirma(nodoDoc, formatoFirma, username, ufficioFirmatario, dataFirma, codiceDoc, commentoFirma);
      wfCommon.taskEndMajorVersion(nodoDoc, statoFinale);
      setPermessiRespinto(nodoDoc);
    }
    // INVIO NOTIFICA
    tipologiaNotifica = 'compitoAssegnato';
    if (people.getPerson(execution.getVariable('wfvarUtenteRichiedente'))) {
      notificaMailSingolo(people.getPerson(execution.getVariable('wfvarUtenteRichiedente')), tipologiaNotifica);
    }
  }

  function respintoEnd() {
    logHandler("wfFlussoAttestati.js -- bpm_assignee: " + task.getVariable('bpm_assignee').properties.userName);
    logHandler("wfFlussoAttestati.js -- wfcnr_reviewOutcome: " + task.getVariable('wfcnr_reviewOutcome'));
    logHandler("wfFlussoAttestati.js -- bpm_comment: " + task.getVariable('bpm_comment'));
    execution.setVariable('wfcnr_reviewOutcome', task.getVariable('wfcnr_reviewOutcome'));
    execution.setVariable('wfvarCommento', task.getVariable('bpm_comment'));
    logHandler("wfFlussoAttestati.js -- bpm_assignee userName: " + execution.getVariable('wfvarUtenteFirmatario'));
    bpm_assignee = people.getPerson(execution.getVariable('wfvarUtenteFirmatario'));
  }

  function flussoAttestatiEndSettings() {
    var tipologiaNotifica, destinatari;
    logHandler("wfFlussoAttestati.js -- flussoAttestatiEndSettings ");
    // INVIO NOTIFICA
    tipologiaNotifica = 'flussoCompletato';
    destinatari = execution.getVariable('wfvarResponsabiliATTESTATI');
    if (people.getGroup(destinatari)) {
      notificaMailGruppo(people.getGroup(destinatari), tipologiaNotifica);
    }
    if (people.getPerson(execution.getVariable('wfvarUtenteRichiedente'))) {
      notificaMailSingolo(people.getPerson(execution.getVariable('wfvarUtenteRichiedente')), tipologiaNotifica);
    }
    // --------------
  }
  return {
    setNomeFlusso : setNomeFlusso,
    flussoAttestatiSartSettings : flussoAttestatiSartSettings,
    validazione : validazione,
    validazioneEnd : validazioneEnd,
    Approva : Approva,
    respinto : respinto,
    respintoEnd : respintoEnd,
    flussoAttestatiEndSettings : flussoAttestatiEndSettings
  };
}

  ());

