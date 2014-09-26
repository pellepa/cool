package it.cnr.cool.rest;

import static org.junit.Assert.assertEquals;
import it.cnr.cool.cmis.service.CMISService;
import it.cnr.cool.interceptor.ProxyInterceptor;
import it.cnr.cool.util.MimeTypes;

import java.io.IOException;

import javax.servlet.http.HttpSession;

import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.annotation.DirtiesContext.ClassMode;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = { "classpath:/META-INF/cool-common-rest-test-context.xml" })
@DirtiesContext(classMode = ClassMode.AFTER_CLASS)
public class ProxyTest {

	private static final String username = "spaclient";

	private static final String URL = "url";

	private static final Logger LOGGER = LoggerFactory.getLogger(ProxyTest.class);

	@Autowired
	private Proxy proxy;
	@Autowired
	private CMISService cmisService;

	@Test
	public void testGet() throws IOException {

		MockHttpServletRequest req = new MockHttpServletRequest();
		req.setParameter(URL, "service/api/people/" + username);

		MockHttpServletResponse res = new MockHttpServletResponse();

		proxy.get(req, res);

		String content = res.getContentAsString();

		LOGGER.debug(content);

		JSONObject json = new JSONObject(content);

		LOGGER.info(json.toString());

		assertEquals(username, json.get("userName"));

	}

	@Test
	public void testPost() throws IOException {

		MockHttpServletRequest req = new MockHttpServletRequest();
		req.setParameter(URL, "service/cnr/utils/javascript-execution");
		req.setContentType(MimeTypes.JSON.mimetype());
		req.setContent("{\"command\":\"33*3\"}".getBytes());

		MockHttpServletResponse res = new MockHttpServletResponse();

		proxy.post(req, res);

		String content = res.getContentAsString();
		JSONObject json = new JSONObject(content);

		LOGGER.info(json.toString());
		assertEquals(99, json.getJSONObject("output").getInt("content"));
	}

	@Test
	public void testPut() throws IOException {

		MockHttpServletRequest req = new MockHttpServletRequest();

		HttpSession session = req.getSession();
		session.setAttribute(CMISService.BINDING_SESSION,
				cmisService.createBindingSession("admin", "admin"));

		req.setParameter(URL, "service/api/people/" + username);
		req.setContentType(MimeTypes.JSON.mimetype());
		String cognome = "spasiano";
		String jsonData = "{\"lastName\":\"" + cognome + "\"}";
		req.setContent(jsonData.getBytes());

		MockHttpServletResponse res = new MockHttpServletResponse();

		proxy.put(req, res);

		String content = res.getContentAsString();
		JSONObject json = new JSONObject(content);

		LOGGER.info(json.toString());

		assertEquals(cognome, json.getString("lastName"));
	}

	@Test
	public void testDelete() throws IOException {

		MockHttpServletRequest req = new MockHttpServletRequest();
		req.setParameter(URL, "service/api/people/" + username + "_ALTER_EGO");

		MockHttpServletResponse res = new MockHttpServletResponse();

		proxy.delete(req, res);

		assertEquals(HttpStatus.UNAUTHORIZED.value(), res.getStatus());


	}

	@Test
	public void testSetProxyInterceptor() {
		ProxyInterceptor pi = new ProxyInterceptor();
		proxy.setProxyInterceptor(pi);
	}

}
