package it.cnr.cool.util;

import org.apache.commons.io.IOUtils;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.ByteArrayInputStream;
import java.io.InputStream;

import static org.junit.Assert.assertEquals;

public class StringUtilTest {

    private static final Logger LOGGER = LoggerFactory.getLogger(StringUtilTest.class);

    @Test
     public void testGetMd5EmptyString() throws Exception {
        InputStream is = IOUtils.toInputStream("");
        String md5 = StringUtil.getMd5(is);
        LOGGER.info(md5);
        assertEquals("d41d8cd98f00b204e9800998ecf8427e", md5);
    }

    @Test
    public void testGetMd5Space() throws Exception {
        InputStream is = IOUtils.toInputStream(" ");
        String md5 = StringUtil.getMd5(is);
        LOGGER.info(md5);
        assertEquals("7215ee9c7d9dc229d2921a40e899ec5f", md5);
    }



    @Test
    public void testGetMd5String() throws Exception {
        InputStream is = IOUtils.toInputStream("foo bar baz");
        String md5 = StringUtil.getMd5(is);
        LOGGER.info(md5);
        assertEquals("ab07acbb1e496801937adfa772424bf7", md5);
    }

}