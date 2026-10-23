package com.cavienchien.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final AuthInterceptor authInterceptor;

    public WebConfig(AuthInterceptor authInterceptor) {
        this.authInterceptor = authInterceptor;
    }

    // =========================
    // ẢNH
    // =========================

    @Override
public void addResourceHandlers(
        ResourceHandlerRegistry registry
) {
    registry
            .addResourceHandler("/images/**")
            .addResourceLocations(
                    "classpath:/static/images/",
                    "file:uploads/images/"
            );
}

    // =========================
    // PHÂN QUYỀN
    // =========================

    @Override
    public void addInterceptors(
            InterceptorRegistry registry
    ) {

        registry
                .addInterceptor(authInterceptor)
                .addPathPatterns(
                        "/api/**",
                        "/admin/**",
                        "/staff/**"
                )
                .excludePathPatterns(
                        "/api/auth/**"
                );
    }
}
