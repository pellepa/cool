package it.cnr.cool.cmis.service;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import it.cnr.cool.security.service.impl.alfresco.CMISUser;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

import org.apache.chemistry.opencmis.client.api.Session;
import org.apache.chemistry.opencmis.client.bindings.impl.SessionImpl;
import org.apache.chemistry.opencmis.client.bindings.spi.BindingSession;
import org.apache.chemistry.opencmis.commons.data.RepositoryInfo;
import org.apache.chemistry.opencmis.commons.enums.CmisVersion;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.annotation.DirtiesContext.ClassMode;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = { "classpath:/META-INF/cool-common-core-test-context.xml" })
@DirtiesContext(classMode = ClassMode.AFTER_CLASS)
public class CMISServiceTest {

	private static final String TICKET = "org.apache.chemistry.opencmis.password";

	private static final String USER_ADMIN_USERNAME = "user.admin.username";

	private static final String ADMIN_USERNAME = "spaclient";

	@Autowired
	private CMISService cmisService;

	private static final Logger LOGGER = LoggerFactory
			.getLogger(CMISServiceTest.class);

	@Test
	public void testCMISService() {
		LOGGER.warn("Not yet implemented");
	}

	@Test
	public void testGetRepositoriesStringString() {
		LOGGER.warn("Not yet implemented");
	}

	@Test
	public void testGetRepositoriesStringStringString() {
		LOGGER.warn("Not yet implemented");
	}

	@Test
	public void testGetRepositoriesCMISConfigStringStringString() {
		LOGGER.warn("Not yet implemented");
	}

	@Test
	public void testGetRepositoriesMapOfStringString() {
		LOGGER.warn("Not yet implemented");
	}

	@Test
	public void testCreateSession() {
		Session session = cmisService.createSession();
		RepositoryInfo info = session.getRepositoryInfo();
		LOGGER.info(info.getCmisVersion().toString());
		assertEquals(CmisVersion.CMIS_1_0, info.getCmisVersion());
	}

	@Test
	public void testCreateAdminSession() {
		LOGGER.warn("Not yet implemented");
	}

	@Test
	public void testCreateSessionStringString() {
		LOGGER.warn("Not yet implemented");
	}

	@Test
	public void testCreateSessionStringStringString() {
		LOGGER.warn("Not yet implemented");
	}

	@Test
	public void testCreateSessionStringStringStringString() {
		LOGGER.warn("Not yet implemented");
	}

	@Test
	public void testCreateSessionCMISConfigStringStringStringString() {
		LOGGER.warn("Not yet implemented");
	}

	@Test
	public void testCreateSessionMapOfStringString() {
		LOGGER.warn("Not yet implemented");
	}

	@Test
	public void testGetAdminUserId() {
		String userId = cmisService.getAdminUserId();
		LOGGER.info(userId);
		assertEquals(ADMIN_USERNAME, userId);
	}

	@Test
	public void testGetAdminSession() {

		SessionImpl session = cmisService.getAdminSession();
		String userId = session.get(USER_ADMIN_USERNAME).toString();
		LOGGER.info(userId);
		assertEquals(ADMIN_USERNAME, userId);
	}

	@Test
	public void testCreateBindingSession() {
		SessionImpl session = cmisService.createBindingSession();
		String userId = session.get(USER_ADMIN_USERNAME).toString();
		LOGGER.info(userId);
		assertEquals(ADMIN_USERNAME, userId);
	}

	@Test
	public void testCreateBindingSessionStringString() {
		LOGGER.warn("Not yet implemented");
	}

	@Test
	public void testGetTicket() {
		LOGGER.warn("Not yet implemented");
	}


	@Test
	public void testSetAtompubURL() {
		LOGGER.warn("Not yet implemented");
	}

	@Test
	public void testGetQueryResultSessionCmisObject() {
		LOGGER.warn("Not yet implemented");
	}

	@Test
	public void testGetQueryResultSessionCriteria() {
		LOGGER.warn("Not yet implemented");
	}

	@Test
	public void testFindDocumentChild() {
		LOGGER.warn("Not yet implemented");
	}

	@Test
	public void testGetCurrentCMISSession() {
		MockHttpSession httpSession = new MockHttpSession();
		Session session = cmisService.getCurrentCMISSession(httpSession);
		String id = session.getRepositoryInfo().getId();
		LOGGER.info(id);
		Session session2 = cmisService.getCurrentCMISSession(httpSession);
		String id2 = session2.getRepositoryInfo().getId();
		assertEquals(id, id2);
	}

	@Test
	public void testGetSiperCurrentBindingSession() {

		MockHttpSession httpSession = new MockHttpSession();
		BindingSession session = cmisService
				.getSiperCurrentBindingSession(httpSession);
		System.out.println(session);

		BindingSession session2 = cmisService
				.getSiperCurrentBindingSession(httpSession);

		assertEquals(session, session2);

	}

	@Test
	public void testGetCurrentBindingSession() {
		HttpServletRequest req = new MockHttpServletRequest();
		req.getSession();
		BindingSession session = cmisService.getCurrentBindingSession(req);
		BindingSession session2 = cmisService.getCurrentBindingSession(req);
		assertEquals(session, session2);
	}

	@Test
	public void testAfterPropertiesSet() {
		LOGGER.warn("Not yet implemented");
	}

	@Test
	public void testGetSessionId() {
		LOGGER.warn("Not yet implemented");
	}

	@Test
	public void testGetCMISUserFromSession() {
		HttpSession session = new MockHttpSession();
		CMISUser user = cmisService.getCMISUserFromSession(session);
		assertNull(user);
	}

	@Test
	public void testGetHttpInvoker() {
		LOGGER.warn("Not yet implemented");
	}

	@Test
	public void testGetBaseURL() {
		LOGGER.warn("Not yet implemented");
	}

	@Test
	public void testUpdateObjectProperties() {
		LOGGER.warn("Not yet implemented");
	}


}
