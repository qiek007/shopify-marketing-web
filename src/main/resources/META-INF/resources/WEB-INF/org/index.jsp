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

        .policy-dialog {
            width: min(820px, calc(100vw - 32px));
            max-height: min(88vh, 880px);
            padding: 0;
            overflow: hidden;
            border: 1px solid rgba(125, 139, 131, .34);
            border-radius: 12px;
            background: #fffefa;
            color: var(--ink);
            box-shadow: 0 34px 90px rgba(6, 23, 19, .28), 0 8px 24px rgba(8, 63, 145, .12);
        }

        .policy-dialog::backdrop {
            background: rgba(5, 17, 14, .64);
            backdrop-filter: blur(5px);
            -webkit-backdrop-filter: blur(5px);
        }

        .policy-dialog-shell {
            display: grid;
            grid-template-rows: auto minmax(0, 1fr) auto;
            max-height: min(88vh, 880px);
        }

        .policy-dialog-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 24px;
            padding: 24px 28px 20px;
            border-bottom: 1px solid var(--line);
            background: linear-gradient(120deg, rgba(0, 200, 135, .08), rgba(11, 114, 208, .06));
        }

        .policy-dialog-header h2 {
            margin: 4px 0 0;
            font-size: 24px;
            font-weight: 600;
            line-height: 1.3;
        }

        .policy-dialog-meta {
            margin: 8px 0 0;
            color: var(--ink-soft);
            font-size: 12px;
        }

        .policy-dialog-close {
            flex: 0 0 auto;
            width: 36px;
            height: 36px;
            display: inline-grid;
            place-items: center;
            padding: 0;
            border: 1px solid var(--line);
            border-radius: 50%;
            background: rgba(255, 255, 255, .82);
            color: var(--ink-soft);
            font-size: 22px;
            line-height: 1;
        }

        .policy-dialog-close:hover,
        .policy-dialog-close:focus-visible {
            border-color: var(--focus);
            color: var(--signal-dark);
            outline: none;
            box-shadow: 0 0 0 3px rgba(0, 126, 90, .1);
        }

        .policy-dialog-body {
            overflow-y: auto;
            padding: 24px 30px 30px;
            overscroll-behavior: contain;
        }

        .policy-dialog-body .policy-summary {
            margin: 0 0 22px;
            padding: 16px 18px;
            border-left: 3px solid var(--signal);
            background: #f3f8f5;
            color: #46504a;
            font-size: 14px;
            line-height: 1.75;
        }

        .policy-dialog-body section + section {
            margin-top: 24px;
        }

        .policy-dialog-body h3 {
            margin: 0 0 9px;
            color: #1f2723;
            font-size: 16px;
            font-weight: 600;
        }

        .policy-dialog-body p,
        .policy-dialog-body li {
            color: #515a55;
            font-size: 14px;
            line-height: 1.82;
        }

        .policy-dialog-body p {
            margin: 8px 0 0;
        }

        .policy-dialog-body ul {
            margin: 8px 0 0;
            padding-left: 1.4em;
        }

        .policy-dialog-footer {
            display: flex;
            justify-content: flex-end;
            padding: 16px 28px;
            border-top: 1px solid var(--line);
            background: #fafaf6;
        }

        .policy-dialog-confirm {
            min-width: 112px;
            min-height: 42px;
            padding: 0 20px;
            border: 0;
            border-radius: 5px;
            background: linear-gradient(110deg, #073d30, #007b57 48%, #0b72d0);
            color: #fff;
            font-weight: 600;
            box-shadow: 0 9px 22px rgba(0, 95, 72, .18);
        }

        @media (max-width: 640px) {
            .policy-dialog-header {
                padding: 20px 20px 16px;
            }

            .policy-dialog-body {
                padding: 20px;
            }

            .policy-dialog-footer {
                padding: 14px 20px;
            }
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
                        <input class="pass-input" id="pass" type="password" autocomplete="current-password"
                               placeholder="请输入登录密码" aria-describedby="passError"/>
                        <input id="encryptedPass" name="pass" type="hidden"/>
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
                <div class="form-options">
                    <label style="color: red;">
                        ${errstr}
                    </label>
                </div>
                <div class="agreement-row">
                    <input id="agreement" type="checkbox" required aria-describedby="agreementError"/>
                    <label for="agreement">我已阅读并同意 <a
                            href="#user-agreement-dialog" data-policy-open="user-agreement-dialog">《用户协议》</a> 和 <a
                            href="#privacy-policy-dialog" data-policy-open="privacy-policy-dialog">《隐私政策》</a></label>
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
                <a href="#privacy-policy-dialog" data-policy-open="privacy-policy-dialog">隐私条款</a>
            </nav>
        </footer>
    </section>
</main>

<dialog class="policy-dialog" id="user-agreement-dialog" aria-labelledby="user-agreement-title">
    <div class="policy-dialog-shell">
        <header class="policy-dialog-header">
            <div>
                <h2 id="user-agreement-title">《滴答互动用户协议》</h2>
                <p class="policy-dialog-meta">更新及生效日期：2026 年 10 月 8 日</p>
            </div>
            <button class="policy-dialog-close" type="button" data-policy-close aria-label="关闭用户协议">×</button>
        </header>
        <article class="policy-dialog-body">
            <p class="policy-summary">欢迎使用滴答互动客户运营与邮件营销服务。请您代表所属企业阅读并理解本协议，特别是数据合规、营销发送、责任限制和服务终止条款。勾选同意并登录，即表示您有权代表所属企业接受本协议。</p>

            <section>
                <h3>一、协议范围与主体</h3>
                <p>本协议由使用滴答互动平台的企业、组织及其获授权人员（统称“用户”）与滴答互动平台运营方（“我们”）共同订立，适用于账户登录、店铺接入、客户管理、邮件模板、营销活动、自动营销、数据分析及相关技术服务。</p>
                <p>如双方另行签署商务合同、数据处理协议或服务订单，约定不一致的，以双方另行签署的文件为准；未约定事项适用本协议。</p>
            </section>

            <section>
                <h3>二、账号注册与使用</h3>
                <ul>
                    <li>用户应提供真实、准确、完整的信息，并确保操作人员获得所属企业合法授权。</li>
                    <li>账号仅限授权人员使用。用户应妥善保管账号、密码和验证信息，不得出借、转让或与无关人员共享。</li>
                    <li>用户发现账号被冒用、权限异常或数据泄露风险时，应立即停止相关操作并通过既有客服或商务渠道联系我们。</li>
                    <li>通过用户账号完成的操作，在能够合理识别为授权操作的范围内，视为用户行为；因平台安全缺陷导致的除外。</li>
                </ul>
            </section>

            <section>
                <h3>三、平台服务</h3>
                <p>平台可提供店铺或自建站接入、客户资料管理、客户分群、模板管理、营销邮件和自动化任务、发送通道配置、额度管理、投递与互动统计等功能。具体功能、可用通道、额度和服务等级以用户界面、服务订单及实际开通内容为准。</p>
                <p>第三方平台或服务（包括电商平台、邮件服务商、统计分析服务等）的可用性、接口规则和数据范围由相应第三方决定。我们会在合理范围内维护集成，但不对第三方自行变更、暂停或故障作不受限制的保证。</p>
            </section>

            <section>
                <h3>四、营销内容与客户数据责任</h3>
                <ul>
                    <li>用户应确保上传、同步或使用的客户信息具有合法来源，并已取得发送营销信息所需的同意或具备其他合法处理依据。</li>
                    <li>用户应保证邮件主题、正文、图片、链接、商品、优惠及发件身份真实、合法，不得发送欺诈、骚扰、侵权、违法或误导性内容。</li>
                    <li>用户应尊重退订、拒绝营销和抑制名单状态，不得规避平台的退订、频控、黑名单或发送资格控制。</li>
                    <li>用户不得导入非法获取的数据，不得利用平台买卖个人信息、实施未经授权的画像、歧视性决策或其他侵害个人权益的行为。</li>
                    <li>因用户的数据来源、发送对象、营销内容或业务决定引发的投诉、索赔或监管责任，由用户依法承担；因平台未按约定处理数据造成的责任由我们依法承担。</li>
                </ul>
            </section>

            <section>
                <h3>五、费用、额度与结算</h3>
                <p>收费项目、邮件额度、有效期和结算方式以服务订单及平台记录为准。测试邮件、正式营销邮件及自动营销邮件可能消耗额度。因发送失败、退信、取消或重试产生的额度处理，以平台公示的计费规则和双方约定为准。</p>
            </section>

            <section>
                <h3>六、知识产权与使用限制</h3>
                <p>平台软件、界面、标识、文档及相关技术的知识产权归我们或合法权利人所有。用户保留其上传内容和业务数据的合法权益，并授予我们在提供服务所必需范围内处理这些内容和数据的权利。</p>
                <p>未经书面许可，用户不得反向工程、恶意扫描、绕过权限或安全控制、干扰服务运行、批量获取非本企业数据，或以平台能力开发直接竞争的复制性服务。</p>
            </section>

            <section>
                <h3>七、服务变更、中断与安全处置</h3>
                <p>我们可为维护、安全、合规或产品改进进行升级，并尽可能提前通知可能产生重大影响的计划性变更。遇到攻击、重大故障、监管要求或明显违法风险时，我们可先行限制相关账号或任务，并在合理期限内说明情况。</p>
            </section>

            <section>
                <h3>八、保密与数据安全</h3>
                <p>双方应对在合作中知悉的商业秘密、技术资料和未公开业务数据承担保密义务。我们将采取与风险相适应的访问控制、传输保护、审计、备份和事件响应措施，并按照《隐私政策》及双方数据处理约定处理个人信息。</p>
            </section>

            <section>
                <h3>九、违约与责任</h3>
                <p>一方违反本协议造成对方损失的，应依法承担相应责任。对于不可抗力、用户自身网络或设备故障、以及非由我们控制的第三方服务异常，各方按照过错和实际影响承担责任。法律禁止限制或免除的责任不受本条限制。</p>
            </section>

            <section>
                <h3>十、期限与终止</h3>
                <p>本协议自用户同意之日起生效。账号停用、合作终止或用户不再具备授权时，用户应停止使用服务。服务终止后，我们将按照法律规定、合同约定及数据保留规则处理或删除相关数据。</p>
            </section>

            <section>
                <h3>十一、适用法律与争议解决</h3>
                <p>本协议适用中华人民共和国法律。争议应先友好协商；协商不成的，任何一方可向依法有管辖权的人民法院提起诉讼。</p>
            </section>

            <section>
                <h3>十二、联系我们</h3>
                <p>如对账号、服务或本协议有疑问，请通过平台已公布的客服渠道、所属企业管理员或双方商务合同载明的联系方式联系我们。</p>
            </section>
        </article>
        <footer class="policy-dialog-footer">
            <button class="policy-dialog-confirm" type="button" data-policy-close>我已阅读</button>
        </footer>
    </div>
</dialog>

<dialog class="policy-dialog" id="privacy-policy-dialog" aria-labelledby="privacy-policy-title">
    <div class="policy-dialog-shell">
        <header class="policy-dialog-header">
            <div>
                <h2 id="privacy-policy-title">《滴答互动隐私政策》</h2>
                <p class="policy-dialog-meta">更新及生效日期：2026 年 10 月 8 日</p>
            </div>
            <button class="policy-dialog-close" type="button" data-policy-close aria-label="关闭隐私政策">×</button>
        </header>
        <article class="policy-dialog-body">
            <p class="policy-summary">本政策说明滴答互动平台如何处理登录用户信息及商户委托处理的客户数据。我们遵循合法、正当、必要、诚信、公开透明和最小范围原则，并采取与风险相适应的安全措施。</p>

            <section>
                <h3>一、适用范围与处理角色</h3>
                <p>本政策适用于滴答互动网页端及相关服务。对于账号、登录、安全和服务管理信息，我们通常是个人信息处理者；对于商户上传、同步并用于客户运营的消费者信息，商户通常决定处理目的和方式，我们依据商户指令作为受托处理方提供技术服务。</p>
            </section>

            <section>
                <h3>二、我们处理的信息</h3>
                <ul>
                    <li>账号与组织信息：用户名、姓名、企业或部门、角色权限、联系方式及账号状态。</li>
                    <li>登录与安全信息：登录时间、IP 地址、浏览器和设备特征、验证码结果、操作日志及异常安全事件。登录密码在浏览器端加密后提交，我们不在登录页面保存明文密码。</li>
                    <li>店铺与服务配置：店铺域名、接入状态、发件身份、发送通道、模板、活动、自动化规则、额度和系统配置。</li>
                    <li>商户客户与交易数据：由商户合法提供或授权同步的客户资料、订阅状态、标签、订单、商品、互动行为、邮件投递和退订记录。</li>
                    <li>支持与沟通信息：问题反馈、工单、沟通记录以及诊断服务所必需的信息。</li>
                </ul>
            </section>

            <section>
                <h3>三、处理目的与方式</h3>
                <p>我们为身份验证、权限控制、提供和维护服务、执行商户配置的营销任务、生成统计报告、保障安全、排查故障、履行合同和法定义务而处理上述信息。我们不会将商户客户数据用于与提供服务无关的独立营销。</p>
            </section>

            <section>
                <h3>四、处理依据与商户责任</h3>
                <p>我们依据订立或履行合同所必需、履行法定义务、取得同意或法律允许的其他情形处理个人信息。商户应负责向其客户履行告知义务、取得必要同意，并响应客户对其业务数据提出的权利请求；我们将在受托范围内提供协助。</p>
            </section>

            <section>
                <h3>五、本地存储与类似技术</h3>
                <p>登录页可在当前浏览器的本地存储中保存“已同意用户协议和隐私政策”的布尔状态，以便下次自动勾选。该记录不包含密码、客户数据或协议正文阅读轨迹。用户可通过取消勾选或清理浏览器站点数据移除该状态。</p>
            </section>

            <section>
                <h3>六、委托处理、共享与第三方服务</h3>
                <p>为提供服务，我们可能按照商户选择和配置使用云基础设施、邮件发送服务商、电商平台、统计分析服务及技术支持供应商。我们会限定处理目的和范围，并要求受托方采取安全措施。除取得授权、履行合同、法定义务或保护重大合法权益等法律允许情形外，我们不会向无关第三方提供个人信息。</p>
            </section>

            <section>
                <h3>七、跨境处理</h3>
                <p>如用户选择的邮件服务商、店铺平台或其他第三方涉及境外处理，我们将根据适用法律及双方约定采取相应合规措施。商户应结合其客户所在地、所选服务商和业务场景履行必要的告知、同意或评估义务。</p>
            </section>

            <section>
                <h3>八、保存期限</h3>
                <p>我们仅在实现处理目的、履行合同和法定义务所需的期限内保存信息。具体期限根据数据类型、商户配置、服务订单、审计及争议处理要求确定。期限届满后，我们将依法删除、匿名化，或停止除存储和必要安全保护之外的处理。</p>
            </section>

            <section>
                <h3>九、安全保护</h3>
                <p>我们采取身份鉴别、最小权限、传输与存储保护、日志审计、备份恢复、漏洞管理和事件响应等措施。发生可能影响个人权益的安全事件时，我们将依法采取补救措施并履行通知或报告义务。</p>
            </section>

            <section>
                <h3>十、您的个人信息权利</h3>
                <p>在适用法律规定的范围内，您有权知情、决定、限制或拒绝处理，并可请求查阅、复制、更正、补充、删除个人信息，撤回基于同意的授权，或注销账号。登录用户可通过所属企业管理员或平台客服提出请求；涉及商户客户数据时，我们会与相应商户协同处理。</p>
            </section>

            <section>
                <h3>十一、未成年人保护</h3>
                <p>本平台面向企业和经授权的工作人员，不以未成年人为目标用户。商户不得在缺乏合法依据或必要监护人同意的情况下，使用平台处理未成年人的个人信息。</p>
            </section>

            <section>
                <h3>十二、政策更新与联系我们</h3>
                <p>业务或法律规则发生重大变化时，我们会更新本政策，并通过页面提示或其他适当方式告知。若处理目的、方式或信息种类发生重大变化，我们将依法重新履行告知或取得同意。</p>
                <p>如需行使个人信息权利、投诉或咨询，请通过平台已公布的客服渠道、所属企业管理员或双方商务合同载明的联系方式联系我们。我们将在核验身份后依法处理。</p>
            </section>
        </article>
        <footer class="policy-dialog-footer">
            <button class="policy-dialog-confirm" type="button" data-policy-close>我已阅读</button>
        </footer>
    </div>
</dialog>

<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script>
    function changeauthcode() {
        document.all.img_authcode.src = 'org/login/authCode?hm=' + Date.parse(new Date())
    }
</script>
<script>
    (() => {
        const pass = document.getElementById('pass');
        const encryptedPass = document.getElementById('encryptedPass');
        const passToggle = document.getElementById('passToggle');
        const eyeIcon = document.getElementById('eyeIcon');
        const authcodeInput = document.getElementById('authcode');
        const agreement = document.getElementById('agreement');
        const authcodeCanvas = document.getElementById('authcodeCanvas');
        const authcodeContext = authcodeCanvas.getContext('2d');
        const authcodeChars = '0123456789';
        const agreementStorageKey = 'dida.login.agreement.accepted.v1';
        let authcodeCode = '';

        try {
            agreement.checked = window.localStorage.getItem(agreementStorageKey) === 'true';
        } catch (error) {
            agreement.checked = false;
        }

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
            const rawPassword = pass.value;
            const userValid = setError(user, user.value.trim() ? '' : '请输入账号');
            const passValid = setError(pass, rawPassword ? '' : '请输入密码');
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
                encryptedPass.value = CryptoJS.AES.encrypt(rawPassword, CryptoJS.enc.Utf8.parse(randomcode), {
                    mode: CryptoJS.mode.ECB,
                    padding: CryptoJS.pad.Pkcs7
                }).toString();
                pass.value = '';
                pass.type = 'password';
                authcodeInput.value = authcode;
            } catch (error) {
                event.preventDefault();
                encryptedPass.value = '';
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
            try {
                window.localStorage.setItem(agreementStorageKey, agreement.checked ? 'true' : 'false');
            } catch (error) {
                // 浏览器禁止本地存储时，仍允许用户在当前页面手动选择。
            }
        });

        document.querySelectorAll('[data-policy-open]').forEach((link) => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const dialog = document.getElementById(link.dataset.policyOpen);
                if (dialog && typeof dialog.showModal === 'function') dialog.showModal();
            });
        });

        document.querySelectorAll('.policy-dialog').forEach((dialog) => {
            dialog.querySelectorAll('[data-policy-close]').forEach((button) => {
                button.addEventListener('click', () => dialog.close());
            });
            dialog.addEventListener('click', (event) => {
                if (event.target === dialog) dialog.close();
            });
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
