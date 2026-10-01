<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ page language="java" pageEncoding="UTF-8" %>
<!DOCTYPE HTML>
<%
    String path = request.getContextPath();
    //String basePath = request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort() + path + "/";
    String basePath = path + "/";
%>
<html lang="zh-CN">
<head>
    <base href="<%=basePath%>">
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <meta name="color-scheme" content="light"/>
    <title>滴答互动 · 登录</title>
    <link rel="preconnect" href="https://fonts.googleapis.com"/>
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600&family=Noto+Sans+SC:wght@400;500;600&display=swap"
          rel="stylesheet"/>
    <style>
        :root {
            --ink: #171918;
            --ink-soft: #626864;
            --paper: #f5f4ef;
            --paper-strong: #fffefa;
            --night: #101312;
            --night-soft: #8d9691;
            --line: #d7dad4;
            --line-dark: #2f3532;
            --signal: #00c887;
            --signal-dark: #007b57;
            --electric-blue: #0b72d0;
            --deep-blue: #083f91;
            --danger: #c53d36;
            --focus: #007e5a;
            --panel-width: min(46vw, 720px);
        }

        * {
            box-sizing: border-box;
        }

        html, body {
            min-height: 100%;
            overflow-x: hidden;
        }

        body {
            margin: 0;
            background: var(--night);
            color: var(--ink);
            font-family: "Manrope", "Noto Sans SC", sans-serif;
            letter-spacing: 0;
        }

        button, input {
            font: inherit;
        }

        button, a, input {
            -webkit-tap-highlight-color: transparent;
        }

        button {
            cursor: pointer;
        }

        a {
            color: inherit;
            text-decoration: none;
        }

        .page {
            min-height: 100dvh;
            display: grid;
            grid-template-columns: minmax(0, 1fr) var(--panel-width);
            overflow: hidden;
        }

        .brand-stage {
            position: relative;
            min-height: 100dvh;
            overflow: hidden;
            isolation: isolate;
            color: #f4f7f5;
            background: linear-gradient(138deg, #101715 0%, #0d1312 46%, #07121a 100%);
            border-right: 1px solid var(--line-dark);
        }

        .brand-stage::before {
            content: "";
            position: absolute;
            inset: 0;
            z-index: -2;
            background-image: linear-gradient(rgba(255, 255, 255, .045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, .045) 1px, transparent 1px);
            background-size: 48px 48px;
            mask-image: linear-gradient(to bottom, #000 0%, rgba(0, 0, 0, .78) 62%, transparent 100%);
            animation: gridDrift 18s ease-in-out infinite alternate;
        }

        .brand-stage::after {
            content: "";
            position: absolute;
            width: min(48vw, 700px);
            aspect-ratio: 1;
            left: 50%;
            top: 48%;
            border: 1px solid rgba(255, 255, 255, .1);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            box-shadow: 0 0 0 72px rgba(0, 200, 135, .028),
            0 0 0 144px rgba(11, 114, 208, .018),
            0 32px 110px rgba(0, 0, 0, .34);
            z-index: -1;
            animation: ringPulse 9s ease-in-out infinite alternate;
        }

        #signalCanvas {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            opacity: .9;
        }

        .brand-inner {
            position: relative;
            min-height: 100dvh;
            padding: clamp(28px, 4.2vw, 72px);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            animation: revealUp .9s cubic-bezier(.2, .72, .2, 1) both;
        }

        .brand-inner::before {
            content: "";
            position: absolute;
            top: -18%;
            bottom: -18%;
            left: -34%;
            width: 22%;
            pointer-events: none;
            opacity: 0;
            transform: skewX(-18deg);
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, .18), rgba(0, 200, 135, .16), transparent);
            filter: blur(8px);
            animation: lightSweep 1.9s .24s cubic-bezier(.18, .72, .2, 1) forwards;
        }

        .stage-kicker,
        .eyebrow,
        .stage-index,
        .stage-meta {
            font-size: 12px;
            font-weight: 600;
            letter-spacing: .14em;
            text-transform: uppercase;
        }

        .stage-kicker {
            display: inline-flex;
            align-items: center;
            gap: 11px;
            color: #c5ccc8;
            text-shadow: 0 2px 14px rgba(0, 0, 0, .3);
        }

        .stage-kicker::before {
            content: "";
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: var(--electric-blue);
            box-shadow: 0 0 0 5px rgba(11, 114, 208, .12),
            0 0 22px rgba(11, 114, 208, .55);
        }

        .stage-copy {
            width: min(680px, 90%);
            padding: 48px 0;
        }

        .stage-index {
            margin-bottom: 22px;
            color: var(--electric-blue);
        }

        .stage-copy h1 {
            margin: 0;
            max-width: 9em;
            font-size: clamp(42px, 5.6vw, 82px);
            line-height: 1.08;
            font-weight: 500;
            letter-spacing: 0;
            overflow-wrap: anywhere;
            text-wrap: balance;
            text-shadow: 0 16px 44px rgba(0, 0, 0, .32);
            animation: revealUp .9s .12s cubic-bezier(.2, .72, .2, 1) both;
        }

        .title-keep-together {
            white-space: nowrap;
        }

        .stage-copy p {
            max-width: 430px;
            margin: 26px 0 0;
            color: #aeb7b2;
            font-size: 15px;
            line-height: 1.8;
            animation: revealUp .8s .22s cubic-bezier(.2, .72, .2, 1) both;
        }

        @media (min-width: 1200px) {
            .stage-copy p {
                width: max-content;
                max-width: none;
                white-space: nowrap;
            }
        }

        .stage-footer {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            gap: 24px;
            padding-top: 22px;
            border-top: 1px solid var(--line-dark);
        }

        .stage-meta {
            color: #737d78;
        }

        .stage-status {
            display: flex;
            align-items: center;
            gap: 10px;
            color: #aeb7b2;
            font-size: 13px;
        }

        .stage-status span:first-child {
            width: 34px;
            height: 1px;
            background: var(--electric-blue);
        }

        .login-panel {
            position: relative;
            min-height: 100dvh;
            padding: clamp(28px, 4vw, 64px) clamp(28px, 5vw, 78px);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            isolation: isolate;
            background: linear-gradient(142deg, #effaf6 0%, #f7f7f3 42%, #eef4fb 100%);
        }

        .login-panel::before,
        .login-panel::after {
            content: "";
            position: absolute;
            pointer-events: none;
            z-index: -1;
        }

        .login-panel::before {
            inset: 0;
            background: linear-gradient(118deg, rgba(0, 200, 135, .12) 0%, transparent 28%),
            linear-gradient(304deg, rgba(11, 114, 208, .11) 0%, transparent 34%);
            opacity: .9;
            background-size: 165% 165%;
            animation: ambientShift 14s ease-in-out infinite alternate;
        }

        .login-panel::after {
            width: 42%;
            height: 150%;
            right: -22%;
            top: -24%;
            transform: rotate(13deg);
            background: linear-gradient(to bottom, rgba(255, 255, 255, .64), rgba(255, 255, 255, .08));
            border-left: 1px solid rgba(255, 255, 255, .62);
            animation: panelSheen 12s 1.5s ease-in-out infinite alternate;
        }

        .panel-header,
        .panel-footer,
        .login-main {
            position: relative;
            z-index: 2;
        }

        .brand-logo {
            display: block;
            width: min(218px, 62%);
            height: auto;
            filter: drop-shadow(0 9px 18px rgba(0, 63, 68, .12));
            animation: revealUp .85s .12s cubic-bezier(.2, .72, .2, 1) both;
        }

        .login-main {
            width: min(100%, 510px);
            flex-shrink: 0;
            margin: clamp(68px, 8vh, 132px) auto 0;
            padding: clamp(32px, 3.1vw, 44px);
            border: 1px solid rgba(255, 255, 255, .78);
            border-radius: 8px;
            background: rgba(255, 255, 255, .7);
            box-shadow: 0 30px 70px rgba(22, 52, 44, .13),
            0 8px 24px rgba(24, 74, 90, .08),
            inset 0 1px 0 rgba(255, 255, 255, .88);
            backdrop-filter: blur(18px);
            -webkit-backdrop-filter: blur(18px);
            animation: panelIn .95s .18s cubic-bezier(.2, .72, .2, 1) both;
        }

        .login-main::before {
            content: "";
            position: absolute;
            top: -1px;
            left: 32px;
            right: 32px;
            height: 2px;
            background: linear-gradient(90deg, transparent, var(--signal), var(--electric-blue), transparent);
            opacity: .72;
        }

        .eyebrow {
            margin: 0 0 16px;
            color: var(--signal-dark);
            text-shadow: 0 1px 10px rgba(0, 123, 87, .08);
        }

        .login-main h2 {
            margin: 0;
            font-size: clamp(32px, 3.4vw, 48px);
            line-height: 1.15;
            font-weight: 500;
            letter-spacing: 0;
            text-shadow: 0 8px 22px rgba(23, 25, 24, .08);
        }

        .intro {
            margin: 14px 0 34px;
            color: var(--ink-soft);
            font-size: 14px;
            line-height: 1.7;
        }

        .form-panel {
            margin-top: 32px;
        }

        .form-panel .field,
        .form-panel .form-options,
        .form-panel .agreement-row,
        .form-panel .submit-button {
            animation: revealUp .7s cubic-bezier(.2, .72, .2, 1) both;
        }

        .form-panel .field:nth-child(1) {
            animation-delay: .26s;
        }

        .form-panel .field:nth-child(2) {
            animation-delay: .34s;
        }

        .form-panel .field:nth-child(3) {
            animation-delay: .42s;
        }

        .form-panel .form-options {
            animation-delay: .5s;
        }

        .form-panel .agreement-row {
            animation-delay: .5s;
        }

        .form-panel .submit-button {
            animation-delay: .58s, 2.2s;
            animation-name: revealUp, buttonBreath;
            animation-duration: .7s, 4.8s;
            animation-timing-function: cubic-bezier(.2, .72, .2, 1), ease-in-out;
            animation-iteration-count: 1, infinite;
        }

        .field {
            margin-bottom: 20px;
        }

        .field-head {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            margin-bottom: 9px;
        }

        label,
        .field-label {
            color: #424744;
            font-size: 13px;
            font-weight: 500;
        }

        .field-wrap {
            position: relative;
        }

        .field input {
            width: 100%;
            height: 54px;
            padding: 0 16px;
            border: 1px solid rgba(125, 139, 131, .34);
            border-radius: 6px;
            outline: none;
            background: rgba(255, 255, 255, .84);
            color: var(--ink);
            font-size: 16px;
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, .9),
            0 6px 18px rgba(22, 52, 44, .04);
            transition: border-color .18s ease, box-shadow .18s ease, background .18s ease, transform .18s ease;
        }

        .field input::placeholder {
            color: #a6aba7;
        }

        .field input:hover {
            border-color: rgba(0, 126, 90, .5);
            box-shadow: 0 8px 22px rgba(22, 52, 44, .07);
        }

        .field input:focus {
            border-color: var(--focus);
            box-shadow: 0 0 0 3px rgba(0, 126, 90, .11),
            0 12px 28px rgba(0, 94, 70, .09);
            background: #fff;
            transform: translateY(-1px);
        }

        .field input[aria-invalid="true"] {
            border-color: var(--danger);
            box-shadow: 0 0 0 3px rgba(197, 61, 54, .1);
        }

        .input-action {
            position: absolute;
            top: 7px;
            right: 7px;
            width: 40px;
            height: 40px;
            display: inline-grid;
            place-items: center;
            border: 0;
            border-radius: 3px;
            background: transparent;
            color: #6d746f;
        }

        .input-action:hover {
            background: #eeeee9;
            color: var(--ink);
        }

        .input-action svg {
            width: 18px;
            height: 18px;
        }

        .pass-input {
            padding-right: 54px !important;
        }

        .authcode-field {
            margin-bottom: 18px;
        }

        .authcode-row {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            align-items: center;
            gap: 10px;
        }

        .authcode-visual {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            min-width: 0;
        }

        .authcode-preview {
            width: 126px;
            height: 50px;
            padding: 0;
            overflow: hidden;
            border: 1px solid rgba(125, 139, 131, .28);
            border-radius: 6px;
            background: rgba(255, 255, 255, .72);
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, .9), 0 6px 18px rgba(22, 52, 44, .04);
            transition: border-color .18s ease, box-shadow .18s ease, transform .18s ease;
        }

        .authcode-preview:hover,
        .authcode-preview:focus-visible {
            border-color: rgba(0, 126, 90, .54);
            box-shadow: 0 0 0 3px rgba(0, 126, 90, .1), 0 10px 22px rgba(22, 52, 44, .08);
            transform: translateY(-1px);
            outline: none;
        }

        .authcode-canvas {
            display: block;
            width: 126px;
            height: 50px;
        }

        .authcode-preview img {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: fill;
        }

        .authcode-refresh {
            flex: 0 0 auto;
            padding: 4px 0;
            border: 0;
            background: transparent;
            color: var(--electric-blue);
            font-size: 12px;
            white-space: nowrap;
        }

        .authcode-refresh:hover,
        .authcode-refresh:focus-visible {
            color: var(--deep-blue);
            text-decoration: underline;
            text-underline-offset: 3px;
            outline: none;
        }

        .authcode-input {
            text-transform: uppercase;
            letter-spacing: .16em;
        }

        .error-message {
            min-height: 18px;
            margin: 7px 0 0;
            color: var(--danger);
            font-size: 12px;
            line-height: 1.5;
        }

        .form-options {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 18px;
            margin: 4px 0 28px;
        }


        .check-label {
            min-height: 28px;
            display: inline-flex;
            align-items: center;
            gap: 9px;
            color: var(--ink-soft);
            cursor: pointer;
        }

        .check-label input {
            width: 17px;
            height: 17px;
            margin: 0;
            accent-color: var(--ink);
        }

        .text-link {
            color: var(--signal-dark);
            font-size: 13px;
            font-weight: 500;
        }

        .text-link:hover {
            text-decoration: underline;
            text-underline-offset: 3px;
        }

        .submit-button {
            width: 100%;
            min-height: 54px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            border: 1px solid var(--ink);
            border-radius: 6px;
            background: linear-gradient(112deg, #101a18 0%, #006f52 54%, #0755a3 100%);
            color: #fff;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 14px 30px rgba(0, 95, 72, .2),
            0 5px 12px rgba(8, 63, 145, .12),
            inset 0 1px 0 rgba(255, 255, 255, .18);
            transition: transform .18s ease, filter .18s ease, box-shadow .18s ease;
        }

        .submit-button:hover {
            filter: brightness(1.08) saturate(1.08);
            box-shadow: 0 18px 36px rgba(0, 95, 72, .24),
            0 7px 16px rgba(8, 63, 145, .15),
            inset 0 1px 0 rgba(255, 255, 255, .2);
            transform: translateY(-2px);
        }

        .submit-button:active {
            transform: translateY(0);
        }

        .submit-button:disabled {
            cursor: wait;
            opacity: .7;
            transform: none;
        }

        .submit-button svg {
            width: 17px;
            height: 17px;
        }


        .agreement-row {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            margin-top: 14px;
            color: #737b76;
            font-size: 12px;
            line-height: 1.65;
        }

        .agreement-row label {
            color: inherit;
            font-size: inherit;
            font-weight: 400;
            line-height: inherit;
        }

        .agreement-row input {
            flex: 0 0 auto;
            width: 15px;
            height: 15px;
            margin: 2px 0 0;
            accent-color: var(--electric-blue);
        }

        .agreement-row input[aria-invalid="true"] {
            outline: 2px solid rgba(197, 61, 54, .32);
            outline-offset: 2px;
        }

        .agreement-row a {
            color: var(--electric-blue);
            white-space: nowrap;
        }

        .agreement-row a:hover {
            color: var(--deep-blue);
            text-decoration: underline;
            text-underline-offset: 3px;
        }

        .agreement-error {
            min-height: 0;
            margin: 4px 0 0 23px;
            color: var(--danger);
            font-size: 12px;
            line-height: 1.45;
        }

        .agreement-error:empty {
            margin-top: 0;
        }

        .button-spinner {
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255, 255, 255, .35);
            border-top-color: #fff;
            border-radius: 50%;
            animation: spin .75s linear infinite;
        }

        .form-message {
            min-height: 22px;
            margin: 14px 0 0;
            color: var(--signal-dark);
            font-size: 13px;
            text-align: center;
        }

        .panel-footer {
            display: none;
            flex-shrink: 0;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
            padding-top: 18px;
            border-top: 1px solid rgba(119, 132, 124, .25);
            color: #858b87;
            font-size: 12px;
            margin-top: auto;
        }

        .panel-footer nav {
            display: flex;
            gap: 18px;
        }

        .panel-footer a:hover {
            color: var(--ink);
        }

        .toast {
            position: fixed;
            left: 50%;
            bottom: 26px;
            z-index: 20;
            max-width: calc(100% - 32px);
            padding: 11px 16px;
            border: 1px solid rgba(255, 255, 255, .15);
            border-radius: 4px;
            background: #171918;
            color: #fff;
            box-shadow: 0 14px 44px rgba(0, 0, 0, .24);
            font-size: 13px;
            transform: translate(-50%, 20px);
            opacity: 0;
            pointer-events: none;
            transition: opacity .2s ease, transform .2s ease;
        }

        .toast.is-visible {
            opacity: 1;
            transform: translate(-50%, 0);
        }

        @keyframes spin {
            to {
                transform: rotate(360deg);
            }
        }

        @keyframes revealUp {
            from {
                opacity: 0;
                transform: translateY(18px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes panelIn {
            from {
                opacity: 0;
                transform: translateY(24px) scale(.985);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        @keyframes lightSweep {
            0% {
                left: -34%;
                opacity: 0;
            }
            18% {
                opacity: .92;
            }
            100% {
                left: 124%;
                opacity: 0;
            }
        }

        @keyframes gridDrift {
            from {
                background-position: 0 0;
            }
            to {
                background-position: 24px 16px;
            }
        }

        @keyframes ringPulse {
            from {
                transform: translate(-50%, -50%) scale(.985);
                opacity: .74;
            }
            to {
                transform: translate(-50%, -50%) scale(1.015);
                opacity: 1;
            }
        }

        @keyframes ambientShift {
            from {
                background-position: 0% 50%;
            }
            to {
                background-position: 100% 50%;
            }
        }

        @keyframes panelSheen {
            from {
                transform: rotate(13deg) translateX(0);
                opacity: .52;
            }
            to {
                transform: rotate(13deg) translateX(-8%);
                opacity: .8;
            }
        }

        @keyframes buttonBreath {
            0%, 100% {
                box-shadow: 0 14px 30px rgba(0, 95, 72, .2), 0 5px 12px rgba(8, 63, 145, .12), inset 0 1px 0 rgba(255, 255, 255, .18);
            }
            50% {
                box-shadow: 0 18px 40px rgba(0, 95, 72, .28), 0 8px 20px rgba(8, 63, 145, .17), inset 0 1px 0 rgba(255, 255, 255, .22);
            }
        }

        @media (max-width: 980px) {
            :root {
                --panel-width: min(52vw, 620px);
            }

            .stage-copy h1 {
                font-size: clamp(38px, 5.2vw, 58px);
            }
        }

        @media (min-width: 761px) and (max-width: 900px) {
            .authcode-row {
                grid-template-columns: 1fr;
            }

            .authcode-visual {
                justify-content: space-between;
            }
        }

        @media (min-width: 761px) {
            html,
            body,
            .page,
            .brand-stage,
            .login-panel {
                height: 100dvh;
                min-height: 0;
            }

            html,
            body {
                overflow: hidden;
            }
        }

        @media (min-width: 761px) and (max-height: 900px) {
            .login-panel {
                padding-block: 24px;
            }

            .brand-logo {
                width: min(176px, 56%);
            }

            .login-main {
                margin-top: clamp(22px, 4vh, 42px);
                padding-block: 22px;
            }

            .eyebrow {
                margin-bottom: 10px;
            }

            .login-main h2 {
                font-size: clamp(32px, 3.2vw, 40px);
            }

            .intro {
                margin: 8px 0 16px;
            }

            .form-panel {
                margin-top: 18px;
            }

            .field {
                margin-bottom: 9px;
            }

            .field-head {
                margin-bottom: 6px;
            }

            .field input {
                height: 48px;
            }

            .input-action {
                top: 4px;
            }

            .error-message {
                min-height: 14px;
                margin-top: 4px;
            }

            .authcode-field {
                margin-bottom: 9px;
            }

            .authcode-preview,
            .authcode-canvas {
                height: 48px;
            }

            .authcode-canvas {
                width: 120px;
            }

            .form-options {
                margin: 2px 0 14px;
            }

            .submit-button {
                min-height: 48px;
                margin-top: 12px;
            }

            .agreement-row {
                margin-top: 10px;
            }

            .agreement-error {
                margin-top: 2px;
            }

            .form-message {
                min-height: 18px;
                margin-top: 8px;
            }

            .panel-footer {
                padding-top: 10px;
            }
        }

        @media (min-width: 761px) and (max-height: 820px) {
            .login-panel {
                padding-block: 20px;
            }

            .brand-logo {
                width: min(164px, 54%);
            }

            .login-main {
                margin-top: 22px;
                padding-block: 20px;
            }

            .eyebrow {
                margin-bottom: 10px;
            }

            .login-main h2 {
                font-size: 32px;
            }

            .intro {
                margin: 8px 0 16px;
            }

            .form-panel {
                margin-top: 16px;
            }

            .field {
                margin-bottom: 8px;
            }

            .field-head {
                margin-bottom: 6px;
            }

            .field input {
                height: 46px;
            }

            .input-action {
                top: 3px;
            }

            .error-message {
                min-height: 12px;
                margin-top: 3px;
            }

            .authcode-field {
                margin-bottom: 8px;
            }

            .authcode-preview,
            .authcode-canvas {
                height: 46px;
            }

            .authcode-canvas {
                width: 116px;
            }

            .form-options {
                margin: 2px 0 12px;
            }

            .submit-button {
                min-height: 46px;
                margin-top: 10px;
            }

            .agreement-row {
                margin-top: 8px;
            }

            .agreement-error {
                margin-top: 2px;
            }

            .form-message {
                min-height: 18px;
                margin-top: 8px;
            }

            .panel-footer {
                padding-top: 10px;
            }
        }

        @media (min-width: 761px) and (min-height: 901px) {
            .login-panel {
                padding-block: clamp(22px, 2.6vh, 38px);
            }

            .brand-logo {
                width: min(188px, 58%);
            }

            .login-main {
                margin-top: clamp(38px, 4.2vh, 62px);
                padding-block: clamp(26px, 2.2vh, 34px);
            }

            .login-main h2 {
                font-size: clamp(34px, 3vw, 42px);
            }

            .intro {
                margin-block: 10px 22px;
            }

            .form-panel {
                margin-top: 20px;
            }

            .field {
                margin-bottom: 12px;
            }

            .field input {
                height: 50px;
            }

            .input-action {
                top: 5px;
            }

            .form-options {
                margin-bottom: 16px;
            }

            .submit-button {
                min-height: 50px;
                margin-top: 16px;
            }

            .panel-footer {
                padding-top: 12px;
            }
        }

        @media (max-width: 760px) {
            body {
                background: var(--paper);
            }

            .authcode-row {
                grid-template-columns: minmax(0, 1fr);
            }

            .authcode-visual {
                justify-content: space-between;
            }

            .page {
                min-height: 100dvh;
                display: block;
                overflow: visible;
            }

            .brand-stage {
                min-height: 272px;
                border-right: 0;
                border-bottom: 1px solid var(--line-dark);
            }

            .brand-stage::after {
                width: 290px;
                top: 65%;
                left: 78%;
                box-shadow: 0 0 0 42px rgba(255, 255, 255, .025);
            }

            .brand-inner {
                min-height: 272px;
                padding: 24px;
            }

            .stage-copy {
                width: 100%;
                padding: 30px 0 24px;
            }

            .stage-copy h1 {
                max-width: 100%;
                font-size: clamp(29px, 7.6vw, 38px);
                line-height: 1.18;
            }

            .stage-copy p, .stage-index {
                display: none;
            }

            .stage-footer {
                padding-top: 14px;
            }

            .stage-meta {
                display: none;
            }

            .login-panel {
                min-height: auto;
                padding: 26px 24px 28px;
            }

            .brand-logo {
                width: min(210px, 64%);
            }

            .login-main {
                width: calc(100vw - 48px);
                max-width: 510px;
                align-self: center;
                margin: 42px auto 56px;
                padding: 34px clamp(26px, 7vw, 36px) 38px;
            }

            .login-main h2 {
                font-size: 34px;
            }

            .panel-footer {
                flex-wrap: wrap;
            }
        }

        @media (max-width: 420px) {
            .brand-stage,
            .brand-inner {
                min-height: 230px;
            }

            .stage-copy {
                padding: 22px 0 16px;
            }

            .stage-copy h1 {
                font-size: 28px;
            }

            .stage-status {
                font-size: 12px;
            }

            .login-panel {
                padding-inline: 20px;
            }

            .login-main {
                width: calc(100vw - 40px);
                margin-block: 36px 48px;
                padding-block: 30px 34px;
            }

            .intro {
                margin-bottom: 26px;
            }

            .authcode-preview {
                width: 104px;
            }

            .authcode-canvas {
                width: 104px;
            }

            .form-options {
                align-items: flex-start;
            }

            .agreement-row {
                font-size: 11px;
            }
        }

        @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after {
                scroll-behavior: auto !important;
                animation-duration: .01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: .01ms !important;
            }
        }
    </style>
</head>
<body>
<main class="page">
    <section class="brand-stage" aria-label="品牌主视觉">
        <canvas id="signalCanvas" aria-hidden="true"></canvas>
        <div class="brand-inner">
            <div class="stage-kicker">Dida Interactive</div>

            <div class="stage-copy">
                <div class="stage-index">GLOBAL CUSTOMER ENGAGEMENT</div>
                <h1>让每一次<span class="title-keep-together">互动</span>都更有价值</h1>
                <p>从客户数据到持续互动，帮助跨境企业更高效、更可靠地开展全球用户运营。</p>
            </div>

            <div class="stage-footer">
                <div class="stage-meta">Shenzhen · China</div>
                <div class="stage-status"><span></span><span>DIDA WORKSPACE</span></div>
            </div>
        </div>
    </section>

    <section class="login-panel" aria-label="用户登录">
        <header class="panel-header">
            <img class="brand-logo" src="shopify/images/dida-login-logo.png" alt="滴答互动"/>
        </header>

        <div class="login-main">
            <p class="eyebrow">DIDA WORKSPACE</p>
            <h2>欢迎回来</h2>

            <form class="form-panel" id="userPanel" novalidate action="<%=request.getContextPath()%>/org/login/login"
                  method="post">
                <script type="text/javascript" src="baseui/lib/endecrypt/crypto-js.min.js"></script>
                <script type="text/javascript" src="baseui/lib/jquery/3.6.1/jquery.min.js"></script>
                <select id="domain" name="domain" onchange="domain_change();" style="height: 30px;display:none">
                    <c:forEach var="domain" items="${domains}">
                        <option value="${domain.id}">${domain.name}</option>
                    </c:forEach>
                </select>
                <input type="hidden" name="logintype" id="logintype" value="0">
                <div class="field">
                    <div class="field-head"><label for="user">账号</label></div>
                    <div class="field-wrap">
                        <input id="user" name="user" type="text" autocomplete="username"
                               placeholder="手机号 / 邮箱 / 用户名" aria-describedby="userError"/>
                    </div>
                    <p class="error-message" id="userError" role="alert"></p>
                </div>

                <div class="field">
                    <div class="field-head"><label for="pass">密码</label></div>
                    <div class="field-wrap">
                        <input class="pass-input" id="pass" name="pass" type="password" autocomplete="current-pass"
                               placeholder="请输入登录密码" aria-describedby="passError"/>
                        <button class="input-action" id="passToggle" type="button" tabindex="-1" aria-label="显示密码">
                            <svg id="eyeIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
                                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <path d="M2.1 12s3.6-6 9.9-6 9.9 6 9.9 6-3.6 6-9.9 6-9.9-6-9.9-6Z"/>
                                <circle cx="12" cy="12" r="2.7"/>
                            </svg>
                        </button>
                    </div>
                    <p class="error-message" id="passError" role="alert"></p>
                </div>

                <div class="field authcode-field">
                    <div class="field-head"><label for="authcode">验证码</label></div>
                    <div class="authcode-row">
                        <input class="authcode-input" id="authcode" name="authcode" type="text" inputmode="text"
                               autocomplete="off" maxlength="4" placeholder="请输入验证码"
                               aria-describedby="authcodeError"/>
                        <div class="authcode-visual">
                            <button class="authcode-preview" type="button" onclick="changeauthcode();" tabindex="-1"
                                    aria-label="刷新验证码">
                                <img id="img_authcode" src="org/login/authCode" alt="验证码">
                            </button>
                            <button class="authcode-refresh" id="kanbuq" type="button" onclick="changeauthcode();"
                                    tabindex="-1">看不清，换一张
                            </button>
                        </div>
                        <div class="authcode-visual" style="display:none">
                            <button class="authcode-preview" id="authcodePreview" type="button" aria-label="刷新验证码">
                                <canvas class="authcode-canvas" id="authcodeCanvas" width="252" height="100"
                                        tabindex="-1"
                                        aria-hidden="true"></canvas>
                            </button>
                            <button class="authcode-refresh" id="authcodeRefresh" type="button">看不清，换一张</button>
                        </div>
                    </div>
                    <p class="error-message" id="authcodeError" role="alert"></p>
                </div>

                <div class="form-options" style="display:none">
                    <label class="check-label" for="remember"><input id="remember" type="checkbox"/>30
                        天内保持登录</label>
                    <a class="text-link" href="#" data-toast="请联系企业管理员重置密码">忘记密码？</a>
                </div>

                <div class="agreement-row">
                    <input id="agreement" type="checkbox" required aria-describedby="agreementError"/>
                    <label for="agreement">我已阅读并同意 <a
                            href="https://test.didalinkin.com/privacy/UserAgreement.html" target="_blank" tabindex="-1"
                            rel="noopener noreferrer">《用户协议》</a> 和 <a
                            href="https://test.didalinkin.com/privacy/PrivacyPolicy.html" target="_blank" tabindex="-1"
                            rel="noopener noreferrer">《隐私政策》</a></label>
                </div>
                <p class="agreement-error" id="agreementError" role="alert"></p>
                <button class="submit-button" type="submit">
                    <span>登录</span>
                </button>
                <p class="form-message" aria-live="polite"></p>
            </form>

        </div>

        <footer class="panel-footer">
            <span>© 2026 滴答互动</span>
            <nav aria-label="辅助链接">
                <a href="#" data-toast="帮助中心即将打开">帮助中心</a>
                <a href="#" data-toast="隐私条款即将打开">隐私条款</a>
            </nav>
        </footer>
    </section>
</main>

<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script>
    function changeauthcode() {
        document.all.img_authcode.src = 'org/login/authCode?hm=' + Date.parse(new Date())
    }
</script>
<script>
    (() => {
        const pass = document.getElementById('pass');
        const passToggle = document.getElementById('passToggle');
        const eyeIcon = document.getElementById('eyeIcon');
        const authcodeInput = document.getElementById('authcode');
        const agreement = document.getElementById('agreement');
        const authcodeCanvas = document.getElementById('authcodeCanvas');
        const authcodeContext = authcodeCanvas.getContext('2d');
        const authcodeChars = '0123456789';
        let authcodeCode = '';

        function randomauthcodeCode() {
            return Array.from({length: 4}, () => authcodeChars[Math.floor(Math.random() * authcodeChars.length)]).join('');
        }

        function drawauthcode() {
            authcodeCode = randomauthcodeCode();
            const width = authcodeCanvas.width;
            const height = authcodeCanvas.height;
            const ctx = authcodeContext;
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, '#e8f4f0');
            gradient.addColorStop(.55, '#f7f3ed');
            gradient.addColorStop(1, '#e5eef8');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            for (let index = 0; index < 7; index += 1) {
                ctx.beginPath();
                ctx.moveTo(Math.random() * width, Math.random() * height);
                ctx.bezierCurveTo(
                    Math.random() * width, Math.random() * height,
                    Math.random() * width, Math.random() * height,
                    Math.random() * width, Math.random() * height
                );
                ctx.strokeStyle = index % 2 ? 'rgba(11, 114, 208, .3)' : 'rgba(0, 126, 90, .28)';
                ctx.lineWidth = 1.5 + Math.random() * 2;
                ctx.stroke();
            }

            for (let index = 0; index < 42; index += 1) {
                ctx.fillStyle = index % 2 ? 'rgba(8, 63, 145, .28)' : 'rgba(0, 126, 90, .24)';
                ctx.beginPath();
                ctx.arc(Math.random() * width, Math.random() * height, 1 + Math.random() * 2.4, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = '600 42px Manrope, Microsoft YaHei, sans-serif';
            [...authcodeCode].forEach((char, index) => {
                const x = 34 + index * 61;
                const y = height / 2 + (Math.random() - .5) * 12;
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate((Math.random() - .5) * .34);
                ctx.fillStyle = index % 2 ? '#0b72d0' : '#007b57';
                ctx.shadowColor = 'rgba(23, 25, 24, .12)';
                ctx.shadowBlur = 4;
                ctx.fillText(char, 0, 0);
                ctx.restore();
            });
        }

        document.getElementById('authcodePreview').addEventListener('click', drawauthcode);
        document.getElementById('authcodeRefresh').addEventListener('click', drawauthcode);
        drawauthcode();

        passToggle.addEventListener('click', () => {
            const reveal = pass.type === 'password';
            pass.type = reveal ? 'text' : 'password';
            passToggle.setAttribute('aria-label', reveal ? '隐藏密码' : '显示密码');
            eyeIcon.innerHTML = reveal
                ? '<path d="M3 3l18 18M10.6 10.7a2.4 2.4 0 003.2 3.2M9.9 4.4A11.3 11.3 0 0112 4.2c6.3 0 9.9 7.8 9.9 7.8a16.7 16.7 0 01-2.7 3.7M6.3 6.3C3.5 8.2 2.1 12 2.1 12s3.6 7.8 9.9 7.8a10.7 10.7 0 004.1-.8"/>'
                : '<path d="M2.1 12s3.6-6 9.9-6 9.9 6 9.9 6-3.6 6-9.9 6-9.9-6-9.9-6Z"/><circle cx="12" cy="12" r="2.7"/>';
        });

        function setError(input, message) {
            const error = document.getElementById(input.getAttribute('aria-describedby'));
            input.setAttribute('aria-invalid', message ? 'true' : 'false');
            if (error) error.textContent = message;
            return !message;
        }

        function showSubmitting(form) {
            const button = form.querySelector('.submit-button');
            const message = form.querySelector('.form-message');
            button.disabled = true;
            button.innerHTML = '<span class="button-spinner" aria-hidden="true"></span><span>正在安全登录...</span>';
            message.textContent = '';
        }

        document.getElementById('userPanel').addEventListener('submit', (event) => {
            const user = document.getElementById('user');
            const userValid = setError(user, user.value.trim() ? '' : '请输入账号');
            const passValid = setError(pass, pass.value ? '' : '请输入密码');
            const authcode = authcodeInput.value.trim();
            const authcodeValid = setError(authcodeInput, authcode ? '' : '请输入验证码');
            const agreementValid = setError(agreement, agreement.checked ? '' : '请先阅读并同意用户协议和隐私政策');
            if (!userValid || !passValid || !authcodeValid || !agreementValid) {
                event.preventDefault();
                return;
            }

            try {
                const pwRandom = "${PWRandom}";
                if (!window.CryptoJS || pwRandom.length < authcode.length) throw new Error('Password encryption unavailable');
                const randomcode = pwRandom.substring(0, pwRandom.length - authcode.length) + authcode;
                pass.value = CryptoJS.AES.encrypt(pass.value, CryptoJS.enc.Utf8.parse(randomcode), {
                    mode: CryptoJS.mode.ECB,
                    padding: CryptoJS.pad.Pkcs7
                }).toString();
                authcodeInput.value = authcode;
            } catch (error) {
                event.preventDefault();
                setError(pass, '密码加密失败，请刷新页面后重试');
                return;
            }

            showSubmitting(event.currentTarget);
        });

        document.querySelectorAll('input').forEach((input) => {
            input.addEventListener('input', () => {
                //if (input === authcodeInput) input.value = input.value.toUpperCase().replace(/[^2-9A-HJ-NP-Z]/g, '').slice(0, 4);
                if (input.hasAttribute('aria-describedby')) setError(input, '');
            });
        });

        agreement.addEventListener('change', () => {
            setError(agreement, agreement.checked ? '' : '请先阅读并同意用户协议和隐私政策');
        });

        const toast = document.getElementById('toast');
        let toastTimer;
        document.querySelectorAll('[data-toast]').forEach((link) => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                toast.textContent = link.dataset.toast;
                toast.classList.add('is-visible');
                window.clearTimeout(toastTimer);
                toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2200);
            });
        });

        const canvas = document.getElementById('signalCanvas');
        const ctx = canvas.getContext('2d');
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let width = 0;
        let height = 0;
        let dpr = 1;
        let pointer = {x: 0.58, y: 0.48};
        let frame = 0;

        const nodes = Array.from({length: 32}, (_, index) => ({
            angle: (index / 32) * Math.PI * 2,
            ring: index % 3,
            phase: ((index * 17) % 31) / 31 * Math.PI * 2
        }));

        function resizeCanvas() {
            const rect = canvas.getBoundingClientRect();
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            width = rect.width;
            height = rect.height;
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        function drawSignal(time = 0) {
            ctx.clearRect(0, 0, width, height);
            const cx = width * pointer.x;
            const cy = height * pointer.y;
            const base = Math.min(width, height) * .19;
            const points = nodes.map((node) => {
                const speed = reducedMotion ? 0 : time * .00008 * (node.ring % 2 ? -1 : 1);
                const radius = base * (1 + node.ring * .5) * (1 + Math.sin(time * .0006 + node.phase) * .035);
                return {
                    x: cx + Math.cos(node.angle + speed) * radius * 1.32,
                    y: cy + Math.sin(node.angle + speed) * radius
                };
            });

            ctx.lineWidth = 1;
            points.forEach((point, index) => {
                const next = points[(index + 7) % points.length];
                const alpha = index % 3 === 0 ? .24 : .11;
                ctx.strokeStyle = index % 4 === 0
                    ? `rgba(11, 114, 208, ${alpha * .9})`
                    : `rgba(0, 200, 135, ${alpha})`;
                ctx.beginPath();
                ctx.moveTo(point.x, point.y);
                ctx.lineTo(next.x, next.y);
                ctx.stroke();
            });

            points.forEach((point, index) => {
                ctx.fillStyle = index % 7 === 0
                    ? 'rgba(11, 114, 208, .9)'
                    : index % 5 === 0
                        ? 'rgba(0, 200, 135, .92)'
                        : 'rgba(236, 244, 240, .38)';
                ctx.beginPath();
                ctx.arc(point.x, point.y, index % 5 === 0 ? 2.4 : 1.35, 0, Math.PI * 2);
                ctx.fill();
            });

            ctx.strokeStyle = 'rgba(0, 200, 135, .32)';
            ctx.beginPath();
            ctx.arc(cx, cy, 7, 0, Math.PI * 2);
            ctx.stroke();

            if (!reducedMotion) frame = requestAnimationFrame(drawSignal);
        }

        canvas.addEventListener('pointermove', (event) => {
            const rect = canvas.getBoundingClientRect();
            pointer.x += ((event.clientX - rect.left) / rect.width - pointer.x) * .12;
            pointer.y += ((event.clientY - rect.top) / rect.height - pointer.y) * .12;
        });

        window.addEventListener('resize', () => {
            resizeCanvas();
            if (reducedMotion) drawSignal();
        });

        resizeCanvas();
        drawSignal();
    })();
</script>
</body>
</html>
