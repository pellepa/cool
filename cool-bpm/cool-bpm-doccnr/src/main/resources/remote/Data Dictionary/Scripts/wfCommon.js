/*global execution, companyhome, logger, utils, cnrutils, use, search, arubaSign, actions, bpm_workflowDescription, wfcnr_wfCounterId, bpm_package, bpm_groupAssignee, bpm_workflowDueDate, bpm_workflowPriority, task, person, Packages, people, bpm_assignee */
var wfCommon = (function () {
  "use strict";
  var DEBUG, serverPath, jsonCNR;
  serverPath = "http://flows.cnr.it";
  DEBUG = true;
  jsonCNR = new Packages.org.springframework.extensions.webscripts.json.JSONUtils();

  function logHandler(testo) {
    if (DEBUG) {
      logger.error("wfCommon.js -- " + testo);
    }
  }

  function infoVersion(nodoDocumento) {
    var folder, nomeFolder, versioni, folders, i;
    folder = search.findNode(nodoDocumento);
    nomeFolder = folder.name;
    versioni = folder.isVersioned;
    logHandler("nomeFolder" + nomeFolder + " versioni " + versioni);
    folders = folder.versionHistory;
    for (i = 0; i < folders.length; i++) {
      logHandler("folder [" + i + "] " + folders[i].label + " type: " + folders[i].type + "(" + folders[i].node.nodeRef + ")");
    }
  }

  function verificaAggiungiVersionamento(nodoDoc) {
    if (nodoDoc.hasAspect('cm:versionable')) {
      logHandler("Il doc: " + nodoDoc.name + " è già versionable");
    } else {
      nodoDoc.addAspect("cm:versionable");
      logHandler("Il doc: " + nodoDoc.name + " è ora versionable");
    }
  }

  function verificaTogliVersionamento(nodoDoc) {
    if (nodoDoc.hasAspect('cm:versionable')) {
      logHandler("rimuovo il versionamento al doc: " + nodoDoc.name);
      nodoDoc.removeAspect("cm:versionable");
    } else {
      logHandler("Il doc: " + nodoDoc.name + " è non versionable");
    }
  }

  function verificaRimuoviVersionamento(nodeRefBando) {
    var nodoBando;
    nodoBando = search.findNode(nodeRefBando);
    if (nodoBando.hasAspect('cm:versionable')) {
      logHandler("rimuovo il versionamento alla cartella: " + nodoBando.name);
      nodoBando.removeAspect("cm:versionable");
    } else {
      logHandler("la cartella: " + nodoBando.name + " non è versionable");
    }
  }

  function checkOut(nodeRefBando, nodeRefAppoFolder) {
    var nodoBando, nodoAppoFolder, nodoBandoCheckOut;
    nodoAppoFolder = search.findNode(nodeRefAppoFolder);
    nodoBando = search.findNode(nodeRefBando);
    verificaAggiungiVersionamento(nodoBando);
    nodoBandoCheckOut = nodoBando.checkout(nodoAppoFolder);
    logHandler("nodoBandoCheckOut: " + nodoBandoCheckOut.name + " nodeRef: " + nodoBandoCheckOut.nodeRef);
    return (nodoBandoCheckOut.nodeRef);
  }

  function checkIn(nodeRefBando) {
    var nodoBando, nodeWorkingCopy, checkInOk;
    checkInOk = false;
    nodoBando = search.findNode(nodeRefBando);
    if (nodoBando.assocs["cm:workingcopylink"][0]) {
      nodeWorkingCopy = nodoBando.assocs["cm:workingcopylink"][0];
      logHandler("CHECK OUT trovato : " + nodeWorkingCopy.name);
      nodeWorkingCopy.checkin();
      logHandler("BANDO AGGIORNATO");
      checkInOk = true;
    } else {
      logHandler("BANDO NON AGGIORNATO");
    }
    return (checkInOk);
  }

  function unCheckOut(nodeRefBando) {
    var nodoBando, nodeWorkingCopy, cancelCheckOutOk;
    cancelCheckOutOk = false;
    nodoBando = search.findNode(nodeRefBando);
    if (nodoBando.assocs["cm:workingcopylink"][0]) {
      nodeWorkingCopy = nodoBando.assocs["cm:workingcopylink"][0];
      logHandler("CHECK OUT trovato : " + nodeWorkingCopy.name);
      nodeWorkingCopy.cancelCheckout();
      logHandler("CANCEL CHECKOUT BANDO ");
      cancelCheckOutOk = true;
    } else {
      logHandler("CANCEL CHECKOUT BANDO NON EFFETTUATO");
    }
    return (cancelCheckOutOk);
  }

  function settaDocPrincipale(nodoDoc) {
    if (nodoDoc.hasAspect('wfcnr:parametriFlusso')) {
      logHandler("settaDocPrincipale - Il documento: " + nodoDoc.name + " risulta gia' con aspect parametriFlusso");
    } else {
      nodoDoc.addAspect("wfcnr:parametriFlusso");
      logHandler("settaDocPrincipale - Il documento: " + nodoDoc.name + " risulta ora con aspect parametriFlusso");
    }
    nodoDoc.properties["wfcnr:tipologiaDOC"] = "Principale";
    nodoDoc.save();
  }

  function copiaMetadatiFlusso(nodoDoc, nodoDocfirmato, tipologiaDOC) {
    logHandler("nodoDoc" + nodoDoc.name + " nodoDocfirmato " + nodoDocfirmato.name);
    if (nodoDocfirmato.hasAspect('wfcnr:parametriFlusso')) {
      logHandler("copiaMetadatiFlusso - Il documento: " + nodoDocfirmato.name + " risulta gia' con aspect parametriFlusso");
    } else {
      nodoDocfirmato.addAspect("wfcnr:parametriFlusso");
      logHandler("copiaMetadatiFlusso - Il documento: " + nodoDocfirmato.name + " risulta ora con aspect parametriFlusso");
    }
    nodoDocfirmato.properties["wfcnr:statoFlusso"] = nodoDoc.properties["wfcnr:statoFlusso"];
    logHandler("copiaMetadatiFlusso - statoFlusso: " + nodoDocfirmato.properties["wfcnr:statoFlusso"]);
    nodoDocfirmato.properties["wfcnr:wfInstanceId"] = nodoDoc.properties["wfcnr:wfInstanceId"];
    logHandler("copiaMetadatiFlusso - wfInstanceId: " + nodoDocfirmato.properties["wfcnr:wfInstanceId"]);
    nodoDocfirmato.properties["wfcnr:titoloUtenteFlusso"] = nodoDoc.properties["wfcnr:titoloUtenteFlusso"];
    logHandler("copiaMetadatiFlusso - titoloUtenteFlusso: " + nodoDocfirmato.properties["wfcnr:titoloUtenteFlusso"]);
    nodoDocfirmato.properties["wfcnr:taskId"] = nodoDoc.properties["wfcnr:taskId"];
    logHandler("copiaMetadatiFlusso - taskId: " + nodoDocfirmato.properties["wfcnr:taskId"]);
    nodoDocfirmato.properties["wfcnr:workflowDefinitionName"] = nodoDoc.properties["wfcnr:workflowDefinitionName"];
    logHandler("copiaMetadatiFlusso - workflowDefinitionName: " + nodoDocfirmato.properties["wfcnr:workflowDefinitionName"]);
    nodoDocfirmato.properties["wfcnr:workflowDefinitionId"] = nodoDoc.properties["wfcnr:workflowDefinitionId"];
    logHandler("copiaMetadatiFlusso - workflowDefinitionId: " + nodoDocfirmato.properties["wfcnr:workflowDefinitionId"]);
    nodoDocfirmato.properties["wfcnr:IdFlusso"] = nodoDoc.properties["wfcnr:IdFlusso"];
    logHandler("copiaMetadatiFlusso - IdFlusso: " + nodoDocfirmato.properties["wfcnr:IdFlusso"]);
    nodoDocfirmato.properties["wfcnr:nodeRefCartellaFlusso"] = nodoDoc.properties["wfcnr:nodeRefCartellaFlusso"];
    logHandler("copiaMetadatiFlusso - nodeRefCartellaFlusso: " + nodoDocfirmato.properties["wfcnr:nodeRefCartellaFlusso"]);
    nodoDocfirmato.properties["wfcnr:tipologiaDOC"] = tipologiaDOC;
    logHandler("copiaMetadatiFlusso - tipologiaDOC: " + nodoDocfirmato.properties["wfcnr:tipologiaDOC"]);
    nodoDocfirmato.save();
  }


  function setMetadatiProtocollo(nodoDocumento, utenteProtocollatore, nrProtocollo, dataTrasmissioneInteroperabilita) {
    logHandler("setMetadatiProtocollo");
    if (!nodoDocumento.hasAspect("wfcnr:parametriProtocollo")) {
      nodoDocumento.addAspect("wfcnr:parametriProtocollo");
      logHandler("Il Doc e' ora parametriProtocollo");
    } else {
      logHandler("Il Doc era già parametriProtocollo");
    }
    nodoDocumento.properties["wfcnr:utenteProtocollatore"] = utenteProtocollatore.properties.userName;
    nodoDocumento.properties["wfcnr:nrProtocollo"] = nrProtocollo;
    nodoDocumento.properties["wfcnr:dataTrasmissioneInteroperabilita"] = dataTrasmissioneInteroperabilita;
    nodoDocumento.save();
    logHandler("Al Doc: " + nodoDocumento.name + " sono stati aggiunti le seguenti proprieta': utenteProtocollatore" + utenteProtocollatore.properties.userName + " nrProtocollo: " + nrProtocollo + " dataTrasmissioneInteroperabilita: " + dataTrasmissioneInteroperabilita);
  }

  function verificaUnicoDocAllegato(wf_package) {
    // controllo che ci sia un solo documento allegato
    if (wf_package !== null) {
      if ((wf_package.children[0] !== null) && (wf_package.children[0] !== undefined)) {
        logHandler("CONTROLLO FLUSSO - wf_package.children[0]: " + wf_package.children[0].name);
        var nodoDoc = wf_package.children[0];
        if (nodoDoc.typeShort.equals("cm:folder")) {
          logHandler("CONTROLLO FLUSSO - IL FLUSSO E' AVVIATO SU UNA CARTELLA");
          throw new Error("NON E' POSSIBILE AVVIARE IL FLUSSO SU UNA CARTELLA");
        }
        if ((wf_package.children.length > 1)) {
          logHandler("CONTROLLO FLUSSO - NON E' POSSIBILE AVVIARE IL FLUSSO SU PIU' FILE");
          throw new Error("NON E' POSSIBILE AVVIARE IL FLUSSO SU PIU' FILE");
        }
      } else {
        throw new Error("DEVE ESSERE ALLEGATO UN DOCUMENTO");
      }
    }
    return (true);
  }

  function verificaDocInUnicoFlusso(wf_package) {
    // controllo che ci sia un solo documento allegato
    if (wf_package !== null) {
      if ((wf_package.children[0] !== null) && (wf_package.children[0] !== undefined)) {
        logHandler("CONTROLLO FLUSSO - wf_package.children[0]: " + wf_package.children[0].name);
        var nodoDoc = wf_package.children[0];
        if (nodoDoc.parentAssocs["bpm:packageContains"].length > 1) {
          logHandler("CONTROLLO FLUSSO - IL DOCUMENTO RISULTA INSERITO IN UN ALTRO FLUSSO GIA' AVVIATO");
          throw new Error("IL DOCUMENTO RISULTA INSERITO IN UN ALTRO FLUSSO GIA' AVVIATO");
        }
      }
    }
    return (true);
  }


  function verificaDocInSingoloFlusso(wf_package) {
    // controllo che ci sia un solo documento allegato
    if (wf_package !== null) {
      if ((wf_package.children[0] !== null) && (wf_package.children[0] !== undefined)) {
        logHandler("CONTROLLO FLUSSO - wf_package.children[0]: " + wf_package.children[0].name);
        var nodoDoc = wf_package.children[0];
        // **** NOTA BENE: IL VALORE DOVRA' ESSERE CAMBIATO AD 1 QUANDO IL FLUSSO CARICHERA' DA ESTERNO UN FILE
        if (nodoDoc.parents.length > 2) {
          logHandler("CONTROLLO FLUSSO - IL FLUSSO E' AVVIATO SU UN DOCUMENTO GIA' UTILIZZATO DA UN ALTRO FLUSSO - nodoDoc.parents.length = " + nodoDoc.parents.length);
          throw new Error("NON E' POSSIBILE AVVIARE IL FLUSSO SU DOCUMENTO GIA' UTILIZZATO DA UN ALTRO FLUSSO");
        }
      } else {
        throw new Error("DEVE ESSERE ALLEGATO UN DOCUMENTO");
      }
    }
    return (true);
  }


  function setTaskVarIntoProcess() {
    // SALVA TUTTE LE VARIABILI DEFINITE ALL'END DEL TASK NELLE VARIABILI DEL WORKFLOW
    logHandler("setTaskVarIntoProcess");
    //DUE DATE
    if (task.dueDate !== undefined && task.dueDate !== null) {
      execution.setVariable('bpm_dueDate', task.dueDate);
    }
    //PRIORITY
    //if (task.priority  !== undefined && task.priority  !== null) {
    //  execution.setVariable('bpm_priority', task.priority);
    //}
    //COMMENT
    execution.setVariable('bpm_comment', task.getVariable('bpm_comment'));
    //REVIEW OUTCOME
    execution.setVariable('wfcnr_reviewOutcome', task.getVariable('wfcnr_reviewOutcome'));
    //REASSIGNABLE
    if (task.getVariable('bpm_reassignable') !== undefined && task.getVariable('bpm_reassignable') !== null) {
      execution.setVariable('bpm_reassignable', task.getVariable('bpm_reassignable'));
    }
  }

  function taskStepMajorVersion(nodoDoc) {
    var workingCopy;
    if (nodoDoc.hasAspect('wfcnr:parametriFlusso')) {
      logHandler("taskStepMajorVersion - Il documento: " + nodoDoc.name + " risulta gia' con aspect parametriFlusso");
    } else {
      nodoDoc.addAspect("wfcnr:parametriFlusso");
      logHandler("taskStepMajorVersion - Il documento: " + nodoDoc.name + " risulta ora con aspect parametriFlusso");
    }
    logHandler("taskStepMajorVersion - task name: " + task.name + "  - taskId: " + task.id);
    verificaAggiungiVersionamento(nodoDoc);
    workingCopy = nodoDoc.checkout();
    workingCopy.properties["wfcnr:taskId"] = 'activiti$' + task.id;
    workingCopy.properties["wfcnr:statoFlusso"] = task.name;
    workingCopy.properties["wfcnr:wfInstanceId"] = execution.getVariable('wfvarWorkflowInstanceId');
    workingCopy.properties["wfcnr:titoloUtenteFlusso"] = bpm_workflowDescription;
    workingCopy.properties["wfcnr:IdFlusso"] = execution.getVariable('wfcnr_wfCounterId');
    workingCopy.properties["wfcnr:nodeRefCartellaFlusso"] = execution.getVariable('wfcnr_wfNodeRefCartellaFlusso');
    if (bpm_package.properties["bpm:workflowDefinitionName"]) {
      workingCopy.properties["wfcnr:workflowDefinitionName"] = bpm_package.properties["bpm:workflowDefinitionName"];
      logHandler("taskStepMajorVersion - workflowDefinitionName: " + bpm_package.properties["bpm:workflowDefinitionName"]);
    }
    if (bpm_package.properties["bpm:workflowDefinitionId"]) {
      workingCopy.properties["wfcnr:workflowDefinitionId"] = bpm_package.properties["bpm:workflowDefinitionId"];
      logHandler("taskStepMajorVersion - workflowDefinitionId: " + bpm_package.properties["bpm:workflowDefinitionId"]);
    }
    workingCopy.save();
    nodoDoc = workingCopy.checkin("Transizione Flusso a STATO: " + task.name, true);
    logHandler("taskStepMajorVersion - Il documento: " + nodoDoc.name + " risulta versionato: " + nodoDoc.getVersionHistory()[0].label + " con statoFlusso: " + task.name + " per task id: " + task.id);
  }

  function taskEndMajorVersion(nodoDoc, statoFinale) {
    var workingCopy;
    if (nodoDoc.hasAspect('wfcnr:parametriFlusso')) {
      logHandler("taskEndMajorVersion - Il documento: " + nodoDoc.name + " risulta gia' con aspect parametriFlusso");
    } else {
      nodoDoc.addAspect("wfcnr:parametriFlusso");
      logHandler("taskEndMajorVersion - Il documento: " + nodoDoc.name + " risulta ora con aspect parametriFlusso");
    }
    workingCopy = nodoDoc.checkout();
    workingCopy.properties["wfcnr:statoFlusso"] = statoFinale;
    workingCopy.save();
    nodoDoc = workingCopy.checkin("Transizione Flusso a STATO: " + statoFinale, true);
    logHandler("taskEndMajorVersion - Il documento: " + nodoDoc.name + " risulta versionato: " + nodoDoc.getVersionHistory()[0].label + " con statoFlusso: " + statoFinale);
  }

  function setMetadatiFirma(nodoDocumento, formatoFirma, utenteFirmatario, ufficioFirmatario, dataFirma, codiceDoc, commentoFirma, nodeRefFileOriginale) {
    if (!nodoDocumento.hasAspect("wfcnr:signable")) {
      nodoDocumento.addAspect("wfcnr:signable");
      logHandler("Il Doc e' ora signable");
    }
    nodoDocumento.properties["wfcnr:tipologiaDOC"] = "Firmato";
    nodoDocumento.properties["wfcnr:formatoFirma"] = formatoFirma;
    nodoDocumento.properties["wfcnr:utenteFirmatario"] = utenteFirmatario;
    nodoDocumento.properties["wfcnr:ufficioFirmatario"] = ufficioFirmatario;
    nodoDocumento.properties["wfcnr:dataFirma"] = dataFirma;
    nodoDocumento.properties["wfcnr:codiceDoc"] = codiceDoc;
    nodoDocumento.properties["wfcnr:commentoFirma"] = commentoFirma;
    nodoDocumento.properties["wfcnr:urlFileFirmato"] =  nodoDocumento.url;
    nodoDocumento.properties["wfcnr:nodeRefFileFirmato"] = nodoDocumento.nodeRef;
    nodoDocumento.properties["wfcnr:nodeRefFileOriginale"] = nodeRefFileOriginale;
    nodoDocumento.save();
    logHandler("Al Doc: " + nodoDocumento.name + " sono stati aggiunti le seguenti proprieta': formatoFirma: " + formatoFirma + " utenteFirmatario: " + utenteFirmatario + " ufficioFirmatario: " + ufficioFirmatario + " dataFirma: " + dataFirma + " codiceDoc: " + codiceDoc + " commentoFirma: " + commentoFirma);
  }

  function setMetadatiFirmaRespinto(nodoDocumento, formatoFirma, utenteFirmatario, ufficioFirmatario, dataFirma, codiceDoc, commentoFirma, nodeRefFileOriginale) {
    if (!nodoDocumento.hasAspect("wfcnr:signable")) {
      nodoDocumento.addAspect("wfcnr:signable");
      logHandler("Il Doc e' ora signable");
    }
    nodoDocumento.properties["wfcnr:formatoFirma"] = formatoFirma;
    nodoDocumento.properties["wfcnr:utenteFirmatario"] = utenteFirmatario;
    nodoDocumento.properties["wfcnr:ufficioFirmatario"] = ufficioFirmatario;
    nodoDocumento.properties["wfcnr:dataFirma"] = dataFirma;
    nodoDocumento.properties["wfcnr:codiceDoc"] = codiceDoc;
    nodoDocumento.properties["wfcnr:commentoFirma"] = commentoFirma;
    nodoDocumento.save();
    logHandler("Al Doc: " + nodoDocumento.name + " sono stati aggiunti le seguenti proprieta': formatoFirma: " + formatoFirma + " utenteFirmatario: " + utenteFirmatario + " ufficioFirmatario: " + ufficioFirmatario + " dataFirma: " + dataFirma + " codiceDoc: " + codiceDoc + " commentoFirma: " + commentoFirma);
  }

  function copiaMetadatiFirma(nodoDocumento, nodoDocumentoFirmato) {
    if (!nodoDocumento.hasAspect("wfcnr:signable")) {
      nodoDocumento.addAspect("wfcnr:signable");
      logHandler("Il Doc Controfirmato e' ora signable");
    }
    nodoDocumento.properties["wfcnr:formatoFirma"] =  nodoDocumentoFirmato.properties["wfcnr:formatoFirma"];
    nodoDocumento.properties["wfcnr:utenteFirmatario"] = nodoDocumentoFirmato.properties["wfcnr:utenteFirmatario"];
    nodoDocumento.properties["wfcnr:ufficioFirmatario"] = nodoDocumentoFirmato.properties["wfcnr:ufficioFirmatario"];
    nodoDocumento.properties["wfcnr:dataFirma"] = nodoDocumentoFirmato.properties["wfcnr:dataFirma"];
    nodoDocumento.properties["wfcnr:codiceDoc"] = nodoDocumentoFirmato.properties["wfcnr:codiceDoc"];
    nodoDocumento.properties["wfcnr:commentoFirma"] = nodoDocumentoFirmato.properties["wfcnr:commentoFirma"];
    nodoDocumento.properties["wfcnr:urlFileFirmato"] =  nodoDocumentoFirmato.properties["wfcnr:urlFileFirmato"];
    nodoDocumento.properties["wfcnr:nodeRefFileFirmato"] = nodoDocumentoFirmato.properties["wfcnr:nodeRefFileFirmato"];
    nodoDocumento.properties["wfcnr:nodeRefFileOriginale"] = nodoDocumentoFirmato.properties["wfcnr:nodeRefFileOriginale"];
    nodoDocumento.save();
    logHandler("Al Doc: " + nodoDocumento.name + " sono stati aggiunti le proprieta' del doc firmato");
  }

  function copiaMetadatiControFirma(nodoDocumento, nodoDocumentoControFirmato) {
    if (!nodoDocumento.hasAspect("wfcnr:parametriControFirma")) {
      nodoDocumento.addAspect("wfcnr:parametriControFirma");
      logHandler("Il Doc Controfirmato e' ora parametriControFirma");
    }
    nodoDocumento.properties["wfcnr:formatoControFirma"] =  nodoDocumentoControFirmato.properties["wfcnr:formatoControFirma"];
    nodoDocumento.properties["wfcnr:utenteControFirmatario"] = nodoDocumentoControFirmato.properties["wfcnr:utenteControFirmatario"];
    nodoDocumento.properties["wfcnr:ufficioControFirmatario"] = nodoDocumentoControFirmato.properties["wfcnr:ufficioControFirmatario"];
    nodoDocumento.properties["wfcnr:dataControFirma"] = nodoDocumentoControFirmato.properties["wfcnr:dataControFirma"];
    nodoDocumento.properties["wfcnr:commentoControFirma"] = nodoDocumentoControFirmato.properties["wfcnr:commentoControFirma"];
    nodoDocumento.properties["wfcnr:urlFileControFirmato"] =  nodoDocumentoControFirmato.properties["wfcnr:urlFileControFirmato"];
    nodoDocumento.properties["wfcnr:nodeRefFileControFirmato"] = nodoDocumentoControFirmato.properties["wfcnr:nodeRefFileControFirmato"];
    nodoDocumento.save();
    logHandler("Al Doc: " + nodoDocumento.name + " sono stati aggiunti le proprieta' del doc controfirmato");
  }

  function setMetadatiControFirma(nodoDocumento, formatoControFirma, utenteControFirmatario, ufficioControFirmatario, dataControFirma, commentoControFirma) {
    if (!nodoDocumento.hasAspect("wfcnr:parametriControFirma")) {
      nodoDocumento.addAspect("wfcnr:parametriControFirma");
      logHandler("Il Doc e' ora parametriControFirma");
    }
    nodoDocumento.properties["wfcnr:tipologiaDOC"] = "Controfirmato";
    nodoDocumento.properties["wfcnr:formatoControFirma"] = formatoControFirma;
    nodoDocumento.properties["wfcnr:utenteControFirmatario"] = utenteControFirmatario;
    nodoDocumento.properties["wfcnr:ufficioControFirmatario"] = ufficioControFirmatario;
    nodoDocumento.properties["wfcnr:dataControFirma"] = dataControFirma;
    nodoDocumento.properties["wfcnr:commentoControFirma"] = commentoControFirma;
    nodoDocumento.properties["wfcnr:urlFileControFirmato"] =  nodoDocumento.url;
    nodoDocumento.properties["wfcnr:nodeRefFileControFirmato"] = nodoDocumento.nodeRef;
    nodoDocumento.save();
    logHandler("Al Doc: " + nodoDocumento.name + " sono stati aggiunti le seguenti proprieta': formatoControFirma: " + formatoControFirma + " utenteControFirmatario: " + utenteControFirmatario + " ufficioControFirmatario: " + ufficioControFirmatario + " dataControFirma: " + dataControFirma + " commentoControFirma: " + commentoControFirma);
  }

  function setMetadatiControFirmaRespinto(nodoDocumento, formatoControFirma, utenteControFirmatario, ufficioControFirmatario, dataControFirma, commentoControFirma) {
    if (!nodoDocumento.hasAspect("wfcnr:parametriControFirma")) {
      nodoDocumento.addAspect("wfcnr:parametriControFirma");
      logHandler("Il Doc e' ora parametriControFirma");
    }
    nodoDocumento.properties["wfcnr:formatoControFirma"] = formatoControFirma;
    nodoDocumento.properties["wfcnr:utenteControFirmatario"] = utenteControFirmatario;
    nodoDocumento.properties["wfcnr:ufficioControFirmatario"] = ufficioControFirmatario;
    nodoDocumento.properties["wfcnr:dataControFirma"] = dataControFirma;
    nodoDocumento.properties["wfcnr:commentoControFirma"] = commentoControFirma;
    nodoDocumento.save();
    logHandler("Al Doc: " + nodoDocumento.name + " sono stati aggiunti le seguenti proprieta': formatoControFirma: " + formatoControFirma + " utenteControFirmatario: " + utenteControFirmatario + " ufficioControFirmatario: " + ufficioControFirmatario + " dataControFirma: " + dataControFirma + " commentoControFirma: " + commentoControFirma);
  }

  function setMetadatiVisto(nodoDocumento, utenteVisto, ufficioVisto, dataVisto, commentoVisto) {
    if (!nodoDocumento.hasAspect("wfcnr:parametriVisto")) {
      nodoDocumento.addAspect("wfcnr:parametriVisto");
      logHandler("Il Doc e' ora parametriVisto");
    }
    nodoDocumento.properties["wfcnr:utenteVisto"] = utenteVisto;
    nodoDocumento.properties["wfcnr:ufficioVisto"] = ufficioVisto;
    nodoDocumento.properties["wfcnr:dataVisto"] = dataVisto;
    nodoDocumento.properties["wfcnr:commentoVisto"] = commentoVisto;
    nodoDocumento.save();
    logHandler("Al Doc: " + nodoDocumento.name + " sono stati aggiunti le seguenti proprieta': utenteVisto: " + utenteVisto + " ufficioVisto: " + ufficioVisto + " dataVisto: " + dataVisto + " commentoVisto: " + commentoVisto);
  }

  function eseguiFirmaP7M(utenteFirmatario, password, otp, nodoDoc, formatoFirma) {
    var mimetypeDoc, nameDoc, nameDocFirmato, docFirmato, mimetypeService, estenzione, firmaEseguita;
    mimetypeDoc = nodoDoc.properties.content.mimetype;
    nameDoc = nodoDoc.name;
    logHandler("eseguiFirmaP7M - utenteFirmatario: "  + utenteFirmatario + " otp: "  + otp + " nodoDoc: " + nodoDoc.name);
    mimetypeService = cnrutils.getBean('mimetypeService');
    estenzione = "." + mimetypeService.getExtension(nodoDoc.mimetype);
    logHandler("estenzione: "  + estenzione);
    if (nodoDoc.name.indexOf(estenzione) === -1) {
      nameDoc = nameDoc + estenzione;
    }
    nameDocFirmato = nameDoc + formatoFirma;
    //crea il doc firmato nella stessa cartella del doc originale
    docFirmato = nodoDoc.parent.createFile(nameDocFirmato);
    //docFirmato.mimetype = "application/p7m";
    docFirmato.save();
    try {
      firmaEseguita = arubaSign.pkcs7SignV2(utenteFirmatario, password, otp, nodoDoc.nodeRef, docFirmato.nodeRef);
    } catch (err) {
      throw new Error("wfCommon.js - IL PROCESSO DI FIRMA DIGITALE NON E' ANDATO A BUON FINE");
    }
    logHandler("doc firmato: "  +  docFirmato.name + " con mimetype: " +  docFirmato.mimetype);
    // rimuovo i permessi di Collaborator al utenteFirmatario
    // create file, make it versionable
    logHandler("Doc: " + nodoDoc.properties.title + " -- " + nodoDoc.properties.description);
    return (docFirmato);
  }

  function eseguiFirma(utenteFirmatario, password, otp, nodoDoc, ufficioFirmatario, codiceDoc, commentoFirma, tipologiaFirma) {
    var mimetypeDoc, nameDoc, nameDocFirmato, docFirmato, mimetypeService, estenzione, firmaEseguita, dataFirma, formatoFirma, workingCopy, j, nodoPadre, nodoDocOriginale;
    dataFirma = new Date();
    mimetypeDoc = nodoDoc.properties.content.mimetype;
    nameDoc = nodoDoc.name;
    logHandler("eseguiFirma utenteFirmatario: "  + utenteFirmatario + " nodoDoc: " + nodoDoc.name);
    mimetypeService = cnrutils.getBean('mimetypeService');
    estenzione = "." + mimetypeService.getExtension(nodoDoc.mimetype);
    logHandler("estenzione: "  + estenzione);
    //*************** CAMBIARE QUANDO è PRONTA LA FIRMA PDF ***************
    //if (estenzione.equals(".pdf")) {
    if (estenzione.equals(".XXXXXXXXXX")) {
      workingCopy = nodoDoc.checkout();
      logHandler("eseguiFirma PDF: ");
      try {
      //SE PDF IL FILE VIENE FIRMATO E VIENE FATTO L'UPDATE SULLO STESSO FILE INCREMENTANDOLO DI VERSIONE MINIOR
        firmaEseguita = arubaSign.pkcs7SignV2(utenteFirmatario, password, otp, nodoDoc.nodeRef, workingCopy.nodeRef);
      } catch (err) {
        throw new Error("wfCommon.js - IL PROCESSO DI FIRMA DIGITALE PDF NON E' ANDATO A BUON FINE");
      }
      //INSERISCO I METADATI FIRMA NEL DOC ORIGINALE
      nodoDoc = workingCopy.checkin("Documento Firmato da " + utenteFirmatario);
      formatoFirma = ".pdf";
      if (tipologiaFirma.equals('Controfirma')) {
        setMetadatiControFirma(nodoDoc, formatoFirma, utenteFirmatario, ufficioFirmatario, dataFirma, codiceDoc, commentoFirma);
      } else {
        setMetadatiFirma(nodoDoc, formatoFirma, utenteFirmatario, ufficioFirmatario, dataFirma, codiceDoc, commentoFirma, nodoDoc.nodeRef);
      }
    } else {
      logHandler("eseguiFirma p7m: ");
      if ((nodoDoc.name.indexOf(estenzione) === -1) && !(estenzione.equals(".bin"))) {
        nameDoc = nameDoc + estenzione;
      }
      formatoFirma = ".p7m";
      if (tipologiaFirma.equals('Controfirma')) {
        if ((nameDoc.substring(nameDoc.length() - 3, nameDoc.length()).equals("p7m"))) {
          formatoFirma = ".countersigned." + nameDoc.substring(nameDoc.length() - 7, nameDoc.length() - 4) + ".p7m";
        }
      }
      nameDocFirmato = nameDoc + formatoFirma;
      //crea il doc firmato nella stessa cartella del doc originale
      docFirmato = nodoDoc.parent.createFile(nameDocFirmato);
      //docFirmato.mimetype = "application/p7m";
      try {
        firmaEseguita = arubaSign.pkcs7SignV2(utenteFirmatario, password, otp, nodoDoc.nodeRef, docFirmato.nodeRef);
      } catch (err2) {
        throw new Error("wfCommon.js - IL PROCESSO DI FIRMA DIGITALE P7m NON E' ANDATO A BUON FINE");
      }
      logHandler("doc firmato: "  +  docFirmato.name + " con mimetype: " +  docFirmato.mimetype);
      // rimuovo i permessi di Collaborator al utenteFirmatario
      // create file, make it versionable
      logHandler("Doc: " + nodoDoc.properties.title + " -- " + nodoDoc.properties.description);
      if (tipologiaFirma.equals('Controfirma')) {
        //INSERISCO I METADATI CONTROFIRMA E FIRMA NEL DOC CONTROFIRMATO
        setMetadatiControFirma(docFirmato, formatoFirma, utenteFirmatario, ufficioFirmatario, dataFirma, codiceDoc, commentoFirma);
        copiaMetadatiFirma(docFirmato, nodoDoc);
        //INSERISCO I METADATI CONTROFIRMA NEL DOC FIRMATO
        copiaMetadatiControFirma(nodoDoc, docFirmato);
        //INSERISCO I METADATI CONTROFIRMA NEL DOC ORIGINALE
        if (nodoDoc.properties["wfcnr:nodeRefFileOriginale"]) {
          nodoDocOriginale = search.findNode(nodoDoc.properties["wfcnr:nodeRefFileOriginale"]);
          if (nodoDocOriginale) {
            copiaMetadatiControFirma(nodoDocOriginale, docFirmato);
          }
        }
      } else {
        //INSERISCO I METADATI FIRMA NEL DOC FIRMATO
        setMetadatiFirma(docFirmato, formatoFirma, utenteFirmatario, ufficioFirmatario, dataFirma, codiceDoc, commentoFirma, nodoDoc.nodeRef);
        //nodoDoc.createAssociation(docFirmato, "wfcnr:signatureAssoc");
        //INSERISCO I METADATI FIRMA NEL DOC ORIGINALE
        copiaMetadatiFirma(nodoDoc, docFirmato);
      }
      //INSERISCO I LINK DEL DOC FIRMATO ANCHE NEL PACKAGE SE NON PRESENTI
      for (j = 0; j < nodoDoc.parents.length; j++) {
        nodoPadre = nodoDoc.parents[j];
        if (((nodoPadre.name.equals(nodoDoc.properties["wfcnr:IdFlusso"])) || (nodoPadre.nodeRef.equals(bpm_package.nodeRef))) && (!(nodoPadre.nodeRef.equals(nodoDoc.parent.nodeRef)))) {
          nodoPadre.addNode(docFirmato);
          logHandler("Aggiungo: " + nodoDoc.properties.title + " alla folder con id: " + nodoPadre.name);
        }
      }
    }
    return (docFirmato);
  }

  function eliminaPermessi(nodoDocumento) {
    // elimina tutti i permessi preesistenti
    var permessi,  i;
    permessi = nodoDocumento.getPermissions();
    nodoDocumento.setInheritsPermissions(false);
    for (i = 0; i < permessi.length; i++) {
      nodoDocumento.removePermission(permessi[i].split(";")[2], permessi[i].split(";")[1]);
      logHandler(i + ") rimuovo permesso: " + permessi[i].split(";")[2] + " a " + permessi[i].split(";")[1]);
    }
    nodoDocumento.setOwner('spaclient');
    logHandler("setPermessi assegno l'ownership del documento: a " + nodoDocumento.getOwner());
  }

  function inserisciDettagliJsonSemplici(gruppo) {
    // controllo che ci sia un solo documento allegato
    var wfvarDettagliFlussoMap, wfvarDettagliFlussoString, wfvarDettagliFlussoObj, data, nomeStato, IsoDate, utenteAssegnatario;
    // VARIABILE DETTAGLI FLUSSO
    data = new Date();
    IsoDate = utils.toISO8601(data);
    nomeStato = task.name;
    wfvarDettagliFlussoMap = [];
    wfvarDettagliFlussoMap.name = nomeStato;
    wfvarDettagliFlussoMap.data = [];
    wfvarDettagliFlussoMap.data.data = IsoDate.toString();
    logHandler("person: " + person.properties.userName);
    if (person.properties.userName.equals("admin")) {
      utenteAssegnatario = "";
    } else {
      utenteAssegnatario = people.getPerson(person.properties.userName).properties.firstName + " " + people.getPerson(person.properties.userName).properties.lastName;
    }
    if (gruppo !== undefined && gruppo !== null && gruppo.length !== 0) {
      wfvarDettagliFlussoMap.data["eseguito da"] = utenteAssegnatario + " (" + gruppo + ")";
    } else {
      wfvarDettagliFlussoMap.data["eseguito da"] = utenteAssegnatario;
    }
    wfvarDettagliFlussoMap.data["con scelta"] = task.getVariable('wfcnr_reviewOutcome');
    if (task.getVariable('bpm_comment') !== undefined && task.getVariable('bpm_comment') !== null && task.getVariable('bpm_comment').length() !== 0) {
      wfvarDettagliFlussoMap.data["con commento"] = task.getVariable('bpm_comment');
    }
    wfvarDettagliFlussoString = execution.getVariable('wfcnr_dettagliFlussoJson');
    wfvarDettagliFlussoObj = jsonCNR.toObject(wfvarDettagliFlussoString);
    wfvarDettagliFlussoObj.tasks.add(wfvarDettagliFlussoMap);
    wfvarDettagliFlussoString = jsonCNR.toJSONString(wfvarDettagliFlussoObj);
    execution.setVariable('wfcnr_dettagliFlussoJson',  wfvarDettagliFlussoString);
    logHandler("wfvarDettagliFlussoString: " + wfvarDettagliFlussoString);
  }

  function inviaNotifica(destinatario, testo, isWorkflowPooled, groupAssignee, nomeFlusso, tipologiaNotifica) {
    var mail, templateArgs, templateModel, groupAssigneeName, taskDefinito;
    if ((groupAssignee) && !(groupAssignee.equals("GENERICO"))) {
      if (groupAssignee.properties.authorityDisplayName) {
        groupAssigneeName = groupAssignee.properties.authorityDisplayName;
      } else {
        groupAssigneeName = groupAssignee.properties.authorityName;
      }
    } else {
      groupAssigneeName = "GENERICO";
    }
    if (destinatario.properties.email) {
      // logHandler("FLUSSO FIRMA IMMEDIATA - invia notifica- destinatario:" + destinatario.properties.email + " testo " + testo + " groupAssignee " + groupAssignee);
      mail = actions.create("mail");
      mail.parameters.to = destinatario.properties.email;
      mail.parameters.subject = "notifica " + nomeFlusso + " (" + bpm_workflowDescription + ")";
      mail.parameters.from = "notifiche-flussi-documentali@cnr.it";
      mail.parameters.text = testo;
      //USING TEMPLATE
      mail.parameters.template = companyhome.childByNamePath("Data Dictionary/Email Templates/Workflow Notification/wf-cnr-email_it.html.ftl");
      templateArgs = [];
      templateArgs.workflowDefinitionName = nomeFlusso;
      templateArgs.workflowTitle = bpm_workflowDescription + " (id: " + execution.getVariable('wfcnr_wfCounterId') + ")";
      templateArgs.workflowPooled = isWorkflowPooled;
      templateArgs.tipologiaNotifica = tipologiaNotifica;
      templateArgs.workflowDescription = bpm_workflowDescription;
      templateArgs.workflowId = execution.getVariable('wfcnr_wfCounterId');
      templateArgs.workflowLinks = false;
      templateArgs.workflowLink = true;
      templateArgs.workflowDueDate = bpm_workflowDueDate;
      templateArgs.workflowPriority = bpm_workflowPriority;
      taskDefinito = typeof task;
      if (taskDefinito !== "undefined") {
        templateArgs.nomeStato = task.name;
      }
      templateArgs.serverPath = serverPath;
      templateArgs.groupAssignee = groupAssigneeName;
      templateArgs.comment = execution.getVariable('bpm_comment');
      templateModel = [];
      templateModel.args = templateArgs;
      mail.parameters.template_model = templateModel;
      //END USING TEMPLATE
      mail.execute(bpm_package);
    }
  }
  return {
    infoVersion : infoVersion,
    verificaAggiungiVersionamento : verificaAggiungiVersionamento,
    verificaTogliVersionamento : verificaTogliVersionamento,
    verificaRimuoviVersionamento : verificaRimuoviVersionamento,
    checkOut : checkOut,
    checkIn : checkIn,
    unCheckOut : unCheckOut,
    eliminaPermessi : eliminaPermessi,
    settaDocPrincipale : settaDocPrincipale,
    setTaskVarIntoProcess : setTaskVarIntoProcess,
    taskStepMajorVersion : taskStepMajorVersion,
    taskEndMajorVersion : taskEndMajorVersion,
    verificaUnicoDocAllegato : verificaUnicoDocAllegato,
    verificaDocInSingoloFlusso : verificaDocInSingoloFlusso,
    verificaDocInUnicoFlusso : verificaDocInUnicoFlusso,
    eseguiFirmaP7M : eseguiFirmaP7M,
    eseguiFirma : eseguiFirma,
    setMetadatiFirma : setMetadatiFirma,
    setMetadatiControFirma : setMetadatiControFirma,
    setMetadatiFirmaRespinto : setMetadatiFirmaRespinto,
    setMetadatiControFirmaRespinto : setMetadatiControFirmaRespinto,
    setMetadatiVisto : setMetadatiVisto,
    copiaMetadatiFlusso : copiaMetadatiFlusso,
    setMetadatiProtocollo : setMetadatiProtocollo,
    inserisciDettagliJsonSemplici : inserisciDettagliJsonSemplici,
    inviaNotifica : inviaNotifica
  };
}

  ());

// MAIN
//var nodeRefBando = "workspace://SpacesStore/f4b79ce0-2231-4ffa-99eb-8cc4d57c9b42";
//wfFlussoBando.bandoSartSettings(nodeRefBando);

//DATI CHE DEVONO ESSERE PASSATI IN INPUT
//var nodeRefBando, nodeRefAppoFolder, nodo, copia, nodoBandoCheckOut;
//nodeRefAppoFolder = "workspace://SpacesStore/334a6951-96c5-4c83-ac77-622aa8b91bd5";
//nodeRefBando  = 'workspace://SpacesStore/98729219-5a87-46a7-8e27-b186182fb2a7';
// _____________________________________
// FUNZIONI RICHIAMABILI DAL WORKFLOW
// _____________________________________
// sequenza 1-2 per approvazione modifiche
// sequenza 1-3 per annulla modifiche
// ********** 1) VERIFICA VERSIONAMENTO E CHECK OUT BANDO IN CARTELLA APPO **********
//nodoBandoCheckOut = wfFlussoBando.checkOut(nodeRefBando, nodeRefAppoFolder);
// ********** 2) CHECK IN COPIA BANDO **********
//wfFlussoBando.checkIn(nodeRefBando);
// ********** 3) CANCEL CHECKOUT COPIA BANDO **********
//wfFlussoBando.unCheckOut(nodeRefBando);
// _____________________________________
// FUNZIONI EXTRA
// _____________________________________
// VISUALIZZA VERSIONI BANDO
// wfFlussoBando.infoVersion(nodeRefBando);
// TOGLI VERSIONAMENTO FOLDER
// wfFlussoBando.verificaRimuoviVersionamento(nodeRefBando);
