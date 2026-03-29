"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function GlobalMotion() {
    const pathname = usePathname();

    useEffect(() => {
        const buttonCleanups: Array<() => void> = [];

        const ctx = gsap.context(() => {
            const main = document.querySelector("[data-page-main='true']");
            if (main) {
                gsap.fromTo(
                    main,
                    { opacity: 0, y: 24 },
                    { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
                );
            }

            const cards = gsap.utils.toArray<HTMLElement>(".dashboard-card");
            if (cards.length > 0) {
                gsap.fromTo(
                    cards,
                    { opacity: 0, y: 20, scale: 0.95 },
                    {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        duration: 0.6,
                        stagger: 0.09,
                        ease: "power2.out",
                    }
                );
            }

            const charts = gsap.utils.toArray<HTMLElement>(".chart-section");
            if (charts.length > 0) {
                gsap.fromTo(
                    charts,
                    { opacity: 0, y: 18 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.75,
                        ease: "power2.out",
                        stagger: 0.1,
                        delay: 0.1,
                    }
                );
            }

            gsap.utils.toArray<HTMLElement>(".scroll-section").forEach((section) => {
                gsap.fromTo(
                    section,
                    { opacity: 0, y: 22 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.7,
                        ease: "power2.out",
                        scrollTrigger: {
                            trigger: section,
                            start: "top 85%",
                            once: true,
                        },
                    }
                );
            });

            const activeSidebarItem = document.querySelector("[data-sidebar-active='true']");
            if (activeSidebarItem) {
                gsap.fromTo(
                    activeSidebarItem,
                    { backgroundColor: "rgba(255, 0, 0, 0.06)" },
                    {
                        backgroundColor: "rgba(192, 0, 24, 0.34)",
                        duration: 0.4,
                        ease: "power2.out",
                    }
                );
            }

            const buttons = gsap.utils.toArray<HTMLElement>(".gsap-btn");
            buttons.forEach((button) => {
                const initialBackground = getComputedStyle(button).backgroundColor;

                const onEnter = () => {
                    gsap.to(button, {
                        scale: 1.05,
                        backgroundColor: "#FF0000",
                        duration: 0.22,
                        ease: "power2.out",
                    });
                };

                const onLeave = () => {
                    gsap.to(button, {
                        scale: 1,
                        backgroundColor: initialBackground,
                        duration: 0.22,
                        ease: "power2.out",
                    });
                };

                button.addEventListener("mouseenter", onEnter);
                button.addEventListener("mouseleave", onLeave);
                buttonCleanups.push(() => {
                    button.removeEventListener("mouseenter", onEnter);
                    button.removeEventListener("mouseleave", onLeave);
                });
            });

            ScrollTrigger.refresh();
        }, document.body);

        return () => {
            buttonCleanups.forEach((cleanup) => cleanup());
            ctx.revert();
            ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
        };
    }, [pathname]);

    return null;
}
