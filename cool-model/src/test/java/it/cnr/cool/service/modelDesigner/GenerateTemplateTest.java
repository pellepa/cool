package it.cnr.cool.service.modelDesigner;

import it.cnr.cool.service.util.AlfrescoDocument;
import org.apache.chemistry.opencmis.client.api.*;
import org.apache.chemistry.opencmis.commons.PropertyIds;
import org.apache.commons.io.IOUtils;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.annotation.DirtiesContext.ClassMode;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import java.io.IOException;
import java.util.*;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = {"classpath:/META-INF/spring/cool-model-test-context.xml"})
@DirtiesContext(classMode = ClassMode.AFTER_CLASS)
public class GenerateTemplateTest {

    final static String TEMPLATE_NAME = "testTemplate";
    private static final Logger LOGGER = LoggerFactory.getLogger(GenerateTemplateTest.class);
    final Date data = new Date();
    private final ArrayList<String> aspectNames = new ArrayList<>();
    @Autowired
    ModelDesignerServiceTest modelDesignerServiceTest;
    @Autowired
    private ModelDesignerService modelDesignerService;
    @Autowired
    private Service service;
    private Session cmisSession;
    private int numTemplates;

    @Before
    public void init() throws IOException {
        cmisSession = service.getAdminSession();

        //Cancello i template di test che sono rimasti da test precedenti
        Document template = (Document) getNodeTemplateForName();
        if (template != null) {
            template.delete(true);
        }

        String suffisso = "Test" + data.getTime();
        String xmlWithAspect = IOUtils.toString(getClass().getResourceAsStream(
                "/updateModel.xml"));

        modelDesignerServiceTest.createModel(xmlWithAspect.replace("test", suffisso), suffisso);
        aspectNames.add(suffisso + ":aspect");

        numTemplates = modelDesignerService.getTemplatesByAspectsName(cmisSession, aspectNames).size();


        Map<String, Object> resp = modelDesignerService.generateTemplate(cmisSession, TEMPLATE_NAME, aspectNames);
        assertTrue(resp.get("status").equals("ok"));
    }


    @After
    public void deleteOldTestModel() {
        modelDesignerServiceTest.deleteModel();
    }


    @Test
    public void testGetTemplatesByAspectsName() throws InterruptedException {
        boolean contentSecondaryType = false;

        Document template = (Document) getNodeTemplateForName();
        assertTrue(template.getProperty(PropertyIds.SECONDARY_OBJECT_TYPE_IDS).getValuesAsString().contains(aspectNames.get(0)));
        assertEquals(template.getName(), TEMPLATE_NAME);

        for (SecondaryType type : template.getSecondaryTypes()) {
            if (type.getQueryName().equals(aspectNames.get(0))) {
                contentSecondaryType = true;
            }
        }
        assertTrue(contentSecondaryType);
        //serve per dare il tempo a solr di indicizzare il template creato
        Thread.sleep(25000);
        List<AlfrescoDocument> templates = modelDesignerService.getTemplatesByAspectsName(cmisSession, aspectNames);
        assertTrue(templates.size() == numTemplates + 1);
    }


    @Test
    public void testGenerateDuplicateTemplate() throws IOException, InterruptedException {

        //rigenero lo stesso template creato nel metoto di inalizzazione per verificare la risposta del metodo
        Map<String, Object> resp = modelDesignerService.generateTemplate(cmisSession, TEMPLATE_NAME, aspectNames);

        assertTrue(resp.get("status").equals("ko"));
        assertTrue(resp.get("message").equals("An object with this name already exists!"));
        assertTrue(resp.get("type").equals("org.apache.chemistry.opencmis.commons.exceptions.CmisContentAlreadyExistsException"));

        Document template = (Document) getNodeTemplateForName();

        assertTrue(template.getProperty(PropertyIds.SECONDARY_OBJECT_TYPE_IDS).getValuesAsString().contains(aspectNames.get(0)));
        assertEquals(template.getName(), TEMPLATE_NAME);
    }


    private CmisObject getNodeTemplateForName() {
        ItemIterable<CmisObject> appo = ((Folder) cmisSession.getObjectByPath(modelDesignerService.pathNodeTemplates)).getChildren();
        Iterator appoIt = appo.iterator();
        while (appoIt.hasNext()) {
            CmisObject children = (CmisObject) appoIt.next();
            if (children.getName().equals(TEMPLATE_NAME)) {
                return children;
            }
        }
        return null;
    }
}