import React from 'react';

const CellularEnergyResetLanding = () => {
  const styles = `
    .cer-page {
      font-family: 'DM Sans', sans-serif;
      color: #1a1a1a;
      line-height: 1.6;
      background: #ffffff;
    }
    
    .cer-container {
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }
    
    /* Header */
    .cer-header {
      background: #ffffff;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e5e5e5;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    
    .cer-header-inner {
      max-width: 1100px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .cer-logo {
      height: 40px;
      width: auto;
    }
    
    .cer-header-cta {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }
    
    .cer-header-phone {
      font-size: 0.9375rem;
      color: #525252;
    }
    
    .cer-header-phone a {
      color: #000000;
      font-weight: 600;
      text-decoration: none;
    }
    
    .cer-btn-small {
      background: #000000;
      color: #ffffff;
      padding: 0.625rem 1.25rem;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.875rem;
      transition: background 0.2s;
    }
    
    .cer-btn-small:hover {
      background: #262626;
    }
    
    /* Hero Section */
    .cer-hero {
      padding: 5rem 1.5rem;
      background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%);
      border-bottom: 2px solid #000000;
    }
    
    .cer-hero-inner {
      max-width: 800px;
      margin: 0 auto;
      text-align: center;
    }
    
    .cer-hero-badge {
      display: inline-block;
      background: #000000;
      color: #ffffff;
      padding: 0.5rem 1rem;
      border-radius: 100px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 1.5rem;
    }
    
    .cer-hero-title {
      font-size: 3rem;
      font-weight: 700;
      line-height: 1.15;
      letter-spacing: -0.03em;
      margin-bottom: 1.5rem;
    }
    
    .cer-hero-title span {
      display: block;
      color: #525252;
      font-weight: 500;
    }
    
    .cer-hero-subtitle {
      font-size: 1.25rem;
      color: #525252;
      line-height: 1.7;
      margin-bottom: 2.5rem;
      max-width: 650px;
      margin-left: auto;
      margin-right: auto;
    }
    
    .cer-hero-cta {
      display: flex;
      justify-content: center;
      gap: 1rem;
      flex-wrap: wrap;
    }
    
    .cer-btn-primary {
      display: inline-block;
      background: #000000;
      color: #ffffff;
      padding: 1rem 2rem;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 1rem;
      transition: all 0.2s;
    }
    
    .cer-btn-primary:hover {
      background: #262626;
      transform: translateY(-1px);
    }
    
    .cer-btn-outline {
      display: inline-block;
      background: transparent;
      color: #000000;
      padding: 1rem 2rem;
      border-radius: 8px;
      border: 2px solid #000000;
      text-decoration: none;
      font-weight: 600;
      font-size: 1rem;
      transition: all 0.2s;
    }
    
    .cer-btn-outline:hover {
      background: #000000;
      color: #ffffff;
    }
    
    /* Trust Bar */
    .cer-trust-bar {
      background: #000000;
      color: #ffffff;
      padding: 1.25rem 1.5rem;
    }
    
    .cer-trust-inner {
      max-width: 1100px;
      margin: 0 auto;
      display: flex;
      justify-content: center;
      gap: 3rem;
      flex-wrap: wrap;
    }
    
    .cer-trust-item {
      font-size: 0.875rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    /* Section Styling */
    .cer-section {
      padding: 5rem 1.5rem;
    }
    
    .cer-section-alt {
      background: #fafafa;
    }
    
    .cer-section-dark {
      background: #000000;
      color: #ffffff;
    }
    
    .cer-section-kicker {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: #737373;
      margin-bottom: 0.75rem;
      text-align: center;
    }
    
    .cer-section-dark .cer-section-kicker {
      color: #a3a3a3;
    }
    
    .cer-section-title {
      font-size: 2.25rem;
      font-weight: 700;
      text-align: center;
      margin-bottom: 1rem;
      letter-spacing: -0.02em;
    }
    
    .cer-section-subtitle {
      font-size: 1.125rem;
      color: #525252;
      text-align: center;
      max-width: 650px;
      margin: 0 auto 3rem;
      line-height: 1.7;
    }
    
    .cer-section-dark .cer-section-subtitle {
      color: #a3a3a3;
    }
    
    /* Who Is This For */
    .cer-persona-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      max-width: 900px;
      margin: 0 auto;
    }
    
    .cer-persona-card {
      background: #ffffff;
      border: 2px solid #000000;
      border-radius: 12px;
      padding: 2rem;
    }
    
    .cer-persona-icon {
      font-size: 2rem;
      margin-bottom: 1rem;
    }
    
    .cer-persona-title {
      font-size: 1.125rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
    }
    
    .cer-persona-desc {
      font-size: 0.9375rem;
      color: #525252;
      line-height: 1.6;
    }
    
    /* The Problem */
    .cer-problem-list {
      max-width: 700px;
      margin: 0 auto;
    }
    
    .cer-problem-item {
      display: flex;
      gap: 1rem;
      padding: 1.25rem 0;
      border-bottom: 1px solid #e5e5e5;
    }
    
    .cer-problem-item:last-child {
      border-bottom: none;
    }
    
    .cer-problem-icon {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      background: #fee2e2;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
    }
    
    .cer-problem-text {
      font-size: 1.0625rem;
      color: #1a1a1a;
    }
    
    /* Assessment Section - NEW */
    .cer-assessment-section {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border: 2px solid #0284c7;
      border-radius: 16px;
      padding: 3rem;
      max-width: 800px;
      margin: 0 auto;
    }
    
    .cer-assessment-badge {
      display: inline-block;
      background: #0284c7;
      color: #ffffff;
      padding: 0.375rem 0.75rem;
      border-radius: 100px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 1rem;
    }
    
    .cer-assessment-title {
      font-size: 1.75rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    
    .cer-assessment-subtitle {
      font-size: 1rem;
      color: #525252;
      margin-bottom: 1.5rem;
    }
    
    .cer-assessment-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      margin-bottom: 2rem;
    }
    
    @media (max-width: 768px) {
      .cer-assessment-grid {
        grid-template-columns: 1fr;
      }
    }
    
    .cer-assessment-includes h4 {
      font-size: 0.8125rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #0284c7;
      margin-bottom: 0.75rem;
    }
    
    .cer-assessment-includes ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .cer-assessment-includes li {
      font-size: 0.9375rem;
      padding: 0.375rem 0;
      padding-left: 1.5rem;
      position: relative;
    }
    
    .cer-assessment-includes li::before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #0284c7;
      font-weight: 700;
    }
    
    .cer-assessment-pricing {
      text-align: center;
      padding: 1.5rem;
      background: #ffffff;
      border-radius: 12px;
    }
    
    .cer-assessment-price {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }
    
    .cer-assessment-credit {
      font-size: 0.9375rem;
      color: #0284c7;
      font-weight: 600;
      margin-bottom: 1rem;
    }
    
    .cer-assessment-cta {
      text-align: center;
    }
    
    .cer-btn-blue {
      display: inline-block;
      background: #0284c7;
      color: #ffffff;
      padding: 1rem 2rem;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 1rem;
      transition: all 0.2s;
    }
    
    .cer-btn-blue:hover {
      background: #0369a1;
      transform: translateY(-1px);
    }
    
    /* What's Included */
    .cer-included-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
      max-width: 900px;
      margin: 0 auto;
    }
    
    @media (max-width: 768px) {
      .cer-included-grid {
        grid-template-columns: 1fr;
      }
    }
    
    .cer-included-card {
      background: #ffffff;
      border: 2px solid #000000;
      border-radius: 12px;
      padding: 2rem;
    }
    
    .cer-included-number {
      display: inline-block;
      background: #000000;
      color: #ffffff;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      text-align: center;
      line-height: 32px;
      font-weight: 700;
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }
    
    .cer-included-title {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    
    .cer-included-detail {
      font-size: 0.9375rem;
      color: #525252;
      margin-bottom: 1rem;
    }
    
    .cer-included-features {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .cer-included-features li {
      font-size: 0.9375rem;
      color: #525252;
      padding: 0.375rem 0;
      padding-left: 1.5rem;
      position: relative;
    }
    
    .cer-included-features li::before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #000000;
      font-weight: 700;
    }
    
    /* How It Works - FIXED TIMELINE */
    .cer-timeline {
      max-width: 800px;
      margin: 0 auto;
    }
    
    .cer-timeline-item {
      display: flex;
      gap: 2rem;
      padding: 2rem 0;
      border-bottom: 1px solid #333333;
      align-items: flex-start;
    }
    
    .cer-timeline-item:last-child {
      border-bottom: none;
    }
    
    .cer-timeline-week {
      flex-shrink: 0;
      width: 90px;
    }
    
    .cer-timeline-badge {
      background: #ffffff;
      color: #000000;
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      white-space: nowrap;
      display: inline-block;
      text-align: center;
    }
    
    .cer-timeline-content h4 {
      font-size: 1.125rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      margin-top: 0;
    }
    
    .cer-timeline-content p {
      font-size: 0.9375rem;
      color: #a3a3a3;
      line-height: 1.6;
      margin: 0;
    }
    
    /* Science Section */
    .cer-science-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 2rem;
      max-width: 900px;
      margin: 0 auto;
    }
    
    @media (max-width: 768px) {
      .cer-science-grid {
        grid-template-columns: 1fr;
      }
    }
    
    .cer-science-card {
      background: #fafafa;
      border-radius: 12px;
      padding: 2rem;
    }
    
    .cer-science-icon {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }
    
    .cer-science-title {
      font-size: 1.125rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
    }
    
    .cer-science-desc {
      font-size: 0.9375rem;
      color: #525252;
      line-height: 1.6;
      margin-bottom: 1rem;
    }
    
    .cer-science-benefits {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .cer-science-benefits li {
      font-size: 0.875rem;
      color: #737373;
      padding: 0.25rem 0;
      padding-left: 1.25rem;
      position: relative;
    }
    
    .cer-science-benefits li::before {
      content: "→";
      position: absolute;
      left: 0;
    }
    
    /* Lab Tracking */
    .cer-lab-section {
      background: #f0fdf4;
      border: 2px solid #22c55e;
      border-radius: 16px;
      padding: 3rem;
      max-width: 900px;
      margin: 0 auto;
    }
    
    .cer-lab-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    
    .cer-lab-badge {
      display: inline-block;
      background: #22c55e;
      color: #ffffff;
      padding: 0.375rem 0.75rem;
      border-radius: 100px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 1rem;
    }
    
    .cer-lab-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    
    .cer-lab-subtitle {
      font-size: 1rem;
      color: #525252;
    }
    
    .cer-lab-markers {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }
    
    .cer-marker-category {
      background: #ffffff;
      border-radius: 8px;
      padding: 1.25rem;
    }
    
    .cer-marker-category h4 {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #22c55e;
      margin-bottom: 0.75rem;
    }
    
    .cer-marker-category ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .cer-marker-category li {
      font-size: 0.875rem;
      color: #1a1a1a;
      padding: 0.25rem 0;
    }
    
    /* Weekly Checkins */
    .cer-checkin-features {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      max-width: 900px;
      margin: 0 auto;
    }
    
    @media (max-width: 768px) {
      .cer-checkin-features {
        grid-template-columns: 1fr;
      }
    }
    
    .cer-checkin-feature {
      text-align: center;
      padding: 1.5rem;
    }
    
    .cer-checkin-icon {
      font-size: 2rem;
      margin-bottom: 1rem;
    }
    
    .cer-checkin-title {
      font-size: 1rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    
    .cer-checkin-desc {
      font-size: 0.875rem;
      color: #525252;
    }
    
    /* VALUE STACK PRICING - NEW */
    .cer-pricing-section {
      max-width: 700px;
      margin: 0 auto;
    }
    
    .cer-value-stack {
      background: #ffffff;
      border: 3px solid #000000;
      border-radius: 16px;
      overflow: hidden;
      margin-bottom: 1.5rem;
    }
    
    .cer-value-header {
      background: #000000;
      color: #ffffff;
      padding: 1.5rem 2rem;
      text-align: center;
    }
    
    .cer-value-header h3 {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
      color: #ffffff;
    }
    
    .cer-value-header p {
      font-size: 0.9375rem;
      color: #a3a3a3;
      margin: 0;
      color: #d4d4d4;
    }
    
    .cer-value-body {
      padding: 2rem;
    }
    
    .cer-value-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.875rem 0;
      border-bottom: 1px solid #f5f5f5;
    }
    
    .cer-value-item:last-child {
      border-bottom: none;
    }
    
    .cer-value-item-name {
      font-size: 0.9375rem;
      color: #1a1a1a;
    }
    
    .cer-value-item-price {
      font-size: 0.9375rem;
      font-weight: 600;
      color: #737373;
    }
    
    .cer-value-total {
      background: #fafafa;
      padding: 1.5rem 2rem;
      border-top: 2px solid #000000;
    }
    
    .cer-value-total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    
    .cer-value-total-row:last-child {
      margin-bottom: 0;
    }
    
    .cer-value-total-label {
      font-size: 1rem;
      color: #525252;
    }
    
    .cer-value-total-amount {
      font-size: 1rem;
      color: #737373;
      text-decoration: line-through;
    }
    
    .cer-value-today-label {
      font-size: 1.125rem;
      font-weight: 700;
      color: #000000;
    }
    
    .cer-value-today-amount {
      font-size: 1.5rem;
      font-weight: 700;
      color: #000000;
    }
    
    .cer-value-savings-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid #e5e5e5;
    }
    
    .cer-value-savings-label {
      font-size: 1rem;
      font-weight: 600;
      color: #22c55e;
    }
    
    .cer-value-savings-amount {
      font-size: 1rem;
      font-weight: 700;
      color: #22c55e;
    }
    
    /* Payment Options */
    .cer-payment-options {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    
    @media (max-width: 768px) {
      .cer-payment-options {
        grid-template-columns: 1fr;
      }
    }
    
    .cer-payment-card {
      border: 2px solid #e5e5e5;
      border-radius: 12px;
      padding: 1.5rem;
      text-align: center;
      transition: all 0.2s;
    }
    
    .cer-payment-card.featured {
      border-color: #000000;
      background: #fafafa;
    }
    
    .cer-payment-badge {
      display: inline-block;
      background: #22c55e;
      color: #ffffff;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.75rem;
    }
    
    .cer-payment-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: #737373;
      margin-bottom: 0.5rem;
    }
    
    .cer-payment-price {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    
    .cer-payment-note {
      font-size: 0.8125rem;
      color: #525252;
    }
    
    .cer-payment-bonus {
      font-size: 0.8125rem;
      color: #22c55e;
      font-weight: 600;
      margin-top: 0.5rem;
    }
    
    /* Guarantee */
    .cer-guarantee {
      background: #fef3c7;
      border: 2px solid #f59e0b;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      text-align: center;
    }
    
    .cer-guarantee-title {
      font-size: 1rem;
      font-weight: 700;
      color: #92400e;
      margin-bottom: 0.5rem;
    }
    
    .cer-guarantee-text {
      font-size: 0.9375rem;
      color: #78350f;
      line-height: 1.6;
      margin: 0;
    }
    
    /* Scarcity */
    .cer-scarcity {
      background: #fef2f2;
      border: 2px solid #dc2626;
      border-radius: 12px;
      padding: 1.25rem;
      margin-bottom: 1.5rem;
      text-align: center;
    }
    
    .cer-scarcity-text {
      font-size: 0.9375rem;
      color: #991b1b;
      font-weight: 600;
      margin: 0;
    }
    
    /* CTA Button */
    .cer-main-cta {
      text-align: center;
    }
    
    .cer-main-cta .cer-btn-primary {
      padding: 1.25rem 3rem;
      font-size: 1.125rem;
    }
    
    .cer-cta-subtext {
      font-size: 0.875rem;
      color: #737373;
      margin-top: 1rem;
    }
    
    /* Maintenance Membership - NEW */
    .cer-maintenance-section {
      background: #ffffff;
      border: 2px solid #e5e5e5;
      border-radius: 16px;
      padding: 2.5rem;
      max-width: 700px;
      margin: 0 auto;
    }
    
    .cer-maintenance-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    
    .cer-maintenance-badge {
      display: inline-block;
      background: #7c3aed;
      color: #ffffff;
      padding: 0.375rem 0.75rem;
      border-radius: 100px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 1rem;
    }
    
    .cer-maintenance-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    
    .cer-maintenance-subtitle {
      font-size: 1rem;
      color: #525252;
    }
    
    .cer-maintenance-includes {
      margin-bottom: 2rem;
    }
    
    .cer-maintenance-includes h4 {
      font-size: 0.875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 1rem;
    }
    
    .cer-maintenance-includes ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .cer-maintenance-includes li {
      font-size: 0.9375rem;
      padding: 0.5rem 0;
      padding-left: 1.75rem;
      position: relative;
      border-bottom: 1px solid #f5f5f5;
    }
    
    .cer-maintenance-includes li:last-child {
      border-bottom: none;
    }
    
    .cer-maintenance-includes li::before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #7c3aed;
      font-weight: 700;
    }
    
    .cer-maintenance-pricing {
      text-align: center;
      padding: 1.5rem;
      background: #f5f3ff;
      border-radius: 12px;
    }
    
    .cer-maintenance-price {
      font-size: 2rem;
      font-weight: 700;
      color: #7c3aed;
    }
    
    .cer-maintenance-price span {
      font-size: 1rem;
      font-weight: 500;
      color: #525252;
    }
    
    .cer-maintenance-compare {
      font-size: 0.875rem;
      color: #525252;
      margin-top: 0.5rem;
    }
    
    /* FAQ */
    .cer-faq-list {
      max-width: 700px;
      margin: 0 auto;
    }
    
    .cer-faq-item {
      border-bottom: 1px solid #e5e5e5;
      padding: 1.5rem 0;
    }
    
    .cer-faq-item:last-child {
      border-bottom: none;
    }
    
    .cer-faq-question {
      font-size: 1.0625rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
    }
    
    .cer-faq-answer {
      font-size: 0.9375rem;
      color: #525252;
      line-height: 1.7;
    }
    
    /* Final CTA */
    .cer-final-cta {
      text-align: center;
    }
    
    .cer-final-cta .cer-section-title {
      margin-bottom: 1.5rem;
    }
    
    .cer-cta-buttons {
      display: flex;
      justify-content: center;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 1.5rem;
    }
    
    .cer-cta-phone {
      font-size: 1rem;
      color: #525252;
    }
    
    .cer-cta-phone a {
      color: #000000;
      font-weight: 600;
    }
    
    /* Footer */
    .cer-footer {
      background: #fafafa;
      border-top: 1px solid #e5e5e5;
      padding: 2rem 1.5rem;
      text-align: center;
    }
    
    .cer-footer-text {
      font-size: 0.875rem;
      color: #737373;
      margin-bottom: 0.5rem;
    }
    
    .cer-footer-links {
      font-size: 0.875rem;
    }
    
    .cer-footer-links a {
      color: #525252;
      text-decoration: none;
    }
    
    .cer-footer-links a:hover {
      text-decoration: underline;
    }
    
    /* Mobile Responsive */
    @media (max-width: 768px) {
      .cer-hero-title {
        font-size: 2.25rem;
      }
      
      .cer-section-title {
        font-size: 1.75rem;
      }
      
      .cer-header-phone {
        display: none;
      }
      
      .cer-trust-inner {
        gap: 1.5rem;
      }
      
      .cer-timeline-item {
        flex-direction: column;
        gap: 1rem;
      }
      
      .cer-timeline-week {
        width: auto;
      }
      
      .cer-price-amount {
        font-size: 2.75rem;
      }
    }
  `;

  return (
    <div className="cer-page">
      <style>{styles}</style>
      
      {/* Header */}
      <header className="cer-header">
        <div className="cer-header-inner">
          <a href="https://range-medical.com">
            <img 
              src="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/695fe7ca6eabe6386b2d84e1.png" 
              alt="Range Medical" 
              className="cer-logo"
            />
          </a>
          <div className="cer-header-cta">
            <span className="cer-header-phone">Questions? <a href="tel:+19499973988">(949) 997-3988</a></span>
            <a href="sms:+19499973988?body=Hi, I'm interested in the Cellular Energy Assessment." className="cer-btn-small">Get Started</a>
          </div>
        </div>
      </header>
      
      {/* Hero */}
      <section className="cer-hero">
        <div className="cer-hero-inner">
          <div className="cer-hero-badge">Lab-Tracked Protocol</div>
          <h1 className="cer-hero-title">
            6-Week Cellular Energy Reset
            <span>Restore your energy at the cellular level</span>
          </h1>
          <p className="cer-hero-subtitle">
            36 HBOT + Red Light sessions, before-and-after labs, and weekly tracking to rebuild your energy at the cellular level.
          </p>
          <div className="cer-hero-cta">
            <a href="#assessment" className="cer-btn-primary">Start With an Assessment →</a>
            <a href="#how-it-works" className="cer-btn-outline">See How It Works</a>
          </div>
        </div>
      </section>
      
      {/* Trust Bar */}
      <div className="cer-trust-bar">
        <div className="cer-trust-inner">
          <div className="cer-trust-item">📍 Newport Beach, CA</div>
          <div className="cer-trust-item">🔬 Lab-Tracked Results</div>
          <div className="cer-trust-item">⏱️ 36 Sessions Over 6 Weeks</div>
          <div className="cer-trust-item">📋 Weekly Check-Ins</div>
        </div>
      </div>
      
      {/* Who Is This For */}
      <section className="cer-section cer-section-alt">
        <div className="cer-container">
          <p className="cer-section-kicker">Is This You?</p>
          <h2 className="cer-section-title">Who This Program Is For</h2>
          <p className="cer-section-subtitle">
            This isn't a quick fix. It's a structured protocol for people ready to invest in real, measurable change.
          </p>
          
          <div className="cer-persona-grid">
            <div className="cer-persona-card">
              <div className="cer-persona-icon">⚡</div>
              <h3 className="cer-persona-title">The Exhausted High Performer</h3>
              <p className="cer-persona-desc">You're doing everything "right" but still feel drained. Coffee barely works anymore. You need energy that doesn't come from stimulants.</p>
            </div>
            <div className="cer-persona-card">
              <div className="cer-persona-icon">🔄</div>
              <h3 className="cer-persona-title">The Post-Illness Rebuilder</h3>
              <p className="cer-persona-desc">You recovered from COVID, mono, or another illness but never bounced back. Your body needs help resetting at the cellular level.</p>
            </div>
            <div className="cer-persona-card">
              <div className="cer-persona-icon">🏃</div>
              <h3 className="cer-persona-title">The Athlete Who Wants More</h3>
              <p className="cer-persona-desc">Recovery takes longer than it used to. You want to accelerate healing, reduce inflammation, and perform at a higher level.</p>
            </div>
            <div className="cer-persona-card">
              <div className="cer-persona-icon">🧬</div>
              <h3 className="cer-persona-title">The Longevity Optimizer</h3>
              <p className="cer-persona-desc">You're proactive about health and want to support mitochondrial function before problems start. Prevention over intervention.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* The Problem */}
      <section className="cer-section">
        <div className="cer-container">
          <p className="cer-section-kicker">The Problem</p>
          <h2 className="cer-section-title">Your Cells Aren't Making Enough Energy</h2>
          <p className="cer-section-subtitle">
            Chronic fatigue, slow recovery, and brain fog often come down to one thing: your mitochondria aren't functioning optimally.
          </p>
          
          <div className="cer-problem-list">
            <div className="cer-problem-item">
              <div className="cer-problem-icon">✕</div>
              <p className="cer-problem-text"><strong>Mitochondrial dysfunction</strong> — Your cellular powerhouses produce less ATP (energy) as stress, age, and inflammation take their toll</p>
            </div>
            <div className="cer-problem-item">
              <div className="cer-problem-icon">✕</div>
              <p className="cer-problem-text"><strong>Chronic low-grade inflammation</strong> — Silent inflammation damages tissues and diverts energy away from repair and recovery</p>
            </div>
            <div className="cer-problem-item">
              <div className="cer-problem-icon">✕</div>
              <p className="cer-problem-text"><strong>Oxygen delivery issues</strong> — Your cells may not be getting enough oxygen to produce energy efficiently</p>
            </div>
            <div className="cer-problem-item">
              <div className="cer-problem-icon">✕</div>
              <p className="cer-problem-text"><strong>Impaired cellular repair</strong> — Without adequate energy, your body can't heal, regenerate, or detoxify properly</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* STEP 1: Assessment - NEW */}
      <section id="assessment" className="cer-section cer-section-alt">
        <div className="cer-container">
          <p className="cer-section-kicker">Step 1</p>
          <h2 className="cer-section-title">Start With a Cellular Energy Assessment</h2>
          <p className="cer-section-subtitle">
            Before committing to the full Reset, get your baseline data. Know exactly where you stand.
          </p>
          
          <div className="cer-assessment-section">
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <span className="cer-assessment-badge">First Step</span>
              <h3 className="cer-assessment-title">Cellular Energy Assessment</h3>
              <p className="cer-assessment-subtitle">The diagnostic that tells you exactly what's going on at the cellular level</p>
            </div>
            
            <div className="cer-assessment-grid">
              <div className="cer-assessment-includes">
                <h4>What's Included:</h4>
                <ul>
                  <li>Cellular Energy Lab Panel (12 biomarkers)</li>
                  <li>Comprehensive symptom & energy questionnaire</li>
                  <li>1:1 provider review of your results</li>
                  <li>Written plan with personalized recommendations</li>
                  <li>1 Red Light + 1 HBOT experience session</li>
                </ul>
              </div>
              
              <div className="cer-assessment-pricing">
                <div className="cer-assessment-price">$497</div>
                <div className="cer-assessment-credit">100% applies to the 6-Week Reset</div>
                <p style={{ fontSize: '0.8125rem', color: '#525252', margin: '0' }}>
                  If you enroll in the Reset within 7 days, your entire $497 is credited toward the program.
                </p>
              </div>
            </div>
            
            <div className="cer-assessment-cta">
              <a href="sms:+19499973988?body=Hi, I'd like to book a Cellular Energy Assessment." className="cer-btn-blue">Book Your Assessment →</a>
            </div>
          </div>
        </div>
      </section>
      
      {/* What's Included in Reset */}
      <section className="cer-section">
        <div className="cer-container">
          <p className="cer-section-kicker">Step 2: The Protocol</p>
          <h2 className="cer-section-title">The 6-Week Cellular Energy Reset</h2>
          <p className="cer-section-subtitle">
            A complete system designed to restore cellular energy over 6 weeks—not a one-time session.
          </p>
          
          <div className="cer-included-grid">
            <div className="cer-included-card">
              <div className="cer-included-number">1</div>
              <h3 className="cer-included-title">18 Red Light Therapy Sessions</h3>
              <p className="cer-included-detail">20 minutes each • 3x per week • Full-body LED bed</p>
              <ul className="cer-included-features">
                <li>Stimulates mitochondrial ATP production</li>
                <li>Reduces inflammation at the cellular level</li>
                <li>Supports collagen and tissue repair</li>
                <li>Customizable Nogier frequencies</li>
              </ul>
            </div>
            
            <div className="cer-included-card">
              <div className="cer-included-number">2</div>
              <h3 className="cer-included-title">18 Hyperbaric Oxygen Sessions</h3>
              <p className="cer-included-detail">60 minutes each • 3x per week • Pressurized chamber</p>
              <ul className="cer-included-features">
                <li>Floods tissues with 10-15x normal oxygen</li>
                <li>Stimulates stem cell release</li>
                <li>Promotes new blood vessel formation</li>
                <li>Accelerates healing and recovery</li>
              </ul>
            </div>
            
            <div className="cer-included-card">
              <div className="cer-included-number">3</div>
              <h3 className="cer-included-title">2 Cellular Energy Lab Panels</h3>
              <p className="cer-included-detail">Baseline + 6-week follow-up • 12 targeted biomarkers</p>
              <ul className="cer-included-features">
                <li>Inflammation markers (CRP-HS, Homocysteine)</li>
                <li>Oxygen utilization (CBC, Ferritin, Iron)</li>
                <li>Growth factors (IGF-1, DHEA-S)</li>
                <li>Metabolic efficiency (Insulin, HgbA1c, Thyroid)</li>
              </ul>
            </div>
            
            <div className="cer-included-card">
              <div className="cer-included-number">4</div>
              <h3 className="cer-included-title">Complete Support & Tracking</h3>
              <p className="cer-included-detail">Provider consultations • Weekly check-ins • Concierge scheduling</p>
              <ul className="cer-included-features">
                <li>2 provider lab review visits with written plans</li>
                <li>Weekly energy tracking & progress check-ins</li>
                <li>Priority scheduling & coordination</li>
                <li>Protocol adjustments as needed</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      
      {/* How It Works (Timeline) */}
      <section id="how-it-works" className="cer-section cer-section-dark">
        <div className="cer-container">
          <p className="cer-section-kicker">Your Journey</p>
          <h2 className="cer-section-title">How The 6 Weeks Work</h2>
          <p className="cer-section-subtitle">
            3 visits per week for 6 weeks. Each visit: HBOT + Red Light together, ~90 minutes door-to-door. We schedule all 18 combo visits at enrollment.
          </p>
          
          <div className="cer-timeline">
            <div className="cer-timeline-item">
              <div className="cer-timeline-week">
                <span className="cer-timeline-badge">Week 0</span>
              </div>
              <div className="cer-timeline-content">
                <h4>Baseline Assessment</h4>
                <p>Complete your Cellular Energy Lab Panel to establish baseline markers. Meet with your provider to review results and set goals. Get oriented to the red light bed and hyperbaric chamber.</p>
              </div>
            </div>
            
            <div className="cer-timeline-item">
              <div className="cer-timeline-week">
                <span className="cer-timeline-badge">Week 1-2</span>
              </div>
              <div className="cer-timeline-content">
                <h4>Activation Phase</h4>
                <p>Your body begins responding to the increased oxygen and light exposure. Many people notice improved sleep and slight energy increases. Inflammation markers begin to shift. 6 red light + 6 HBOT sessions.</p>
              </div>
            </div>
            
            <div className="cer-timeline-item">
              <div className="cer-timeline-week">
                <span className="cer-timeline-badge">Week 3-4</span>
              </div>
              <div className="cer-timeline-content">
                <h4>Adaptation Phase</h4>
                <p>Mitochondrial biogenesis accelerates—your cells are literally building more powerhouses. Energy levels typically show noticeable improvement. Recovery from workouts speeds up. 6 red light + 6 HBOT sessions.</p>
              </div>
            </div>
            
            <div className="cer-timeline-item">
              <div className="cer-timeline-week">
                <span className="cer-timeline-badge">Week 5-6</span>
              </div>
              <div className="cer-timeline-content">
                <h4>Optimization Phase</h4>
                <p>Peak benefits achieved. Cumulative effects are fully realized. Final 6 red light + 6 HBOT sessions completed. Follow-up labs drawn to measure and document your improvements.</p>
              </div>
            </div>
            
            <div className="cer-timeline-item">
              <div className="cer-timeline-week">
                <span className="cer-timeline-badge">Week 7</span>
              </div>
              <div className="cer-timeline-content">
                <h4>Results Review</h4>
                <p>Meet with your provider to compare baseline and follow-up labs. Review your weekly tracking data. Discuss maintenance options to preserve your gains.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* The Science */}
      <section className="cer-section">
        <div className="cer-container">
          <p className="cer-section-kicker">The Science</p>
          <h2 className="cer-section-title">Why This Combination Works</h2>
          <p className="cer-section-subtitle">
            Red light and hyperbaric oxygen work through different but complementary mechanisms—together, they amplify each other's effects.
          </p>
          
          <div className="cer-science-grid">
            <div className="cer-science-card">
              <div className="cer-science-icon">🔴</div>
              <h3 className="cer-science-title">Red Light Therapy (Photobiomodulation)</h3>
              <p className="cer-science-desc">Red and near-infrared light penetrates tissue and is absorbed by cytochrome c oxidase in your mitochondria, directly stimulating ATP production.</p>
              <ul className="cer-science-benefits">
                <li>Increases ATP synthesis by 40-50%</li>
                <li>Reduces oxidative stress</li>
                <li>Decreases inflammatory cytokines</li>
                <li>Enhances collagen production</li>
              </ul>
            </div>
            
            <div className="cer-science-card">
              <div className="cer-science-icon">💨</div>
              <h3 className="cer-science-title">Hyperbaric Oxygen Therapy</h3>
              <p className="cer-science-desc">Breathing pure oxygen under pressure dissolves 10-15x more oxygen into your blood plasma, reaching tissues that red blood cells can't access.</p>
              <ul className="cer-science-benefits">
                <li>Stimulates stem cell mobilization</li>
                <li>Promotes angiogenesis (new blood vessels)</li>
                <li>Reduces inflammation systemically</li>
                <li>Accelerates wound and tissue healing</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      
      {/* Lab Tracking */}
      <section className="cer-section cer-section-alt">
        <div className="cer-container">
          <p className="cer-section-kicker">Measurable Results</p>
          <h2 className="cer-section-title">Lab-Tracked Progress</h2>
          <p className="cer-section-subtitle">
            This isn't guesswork. We measure specific biomarkers before and after so you can see exactly what changed.
          </p>
          
          <div className="cer-lab-section">
            <div className="cer-lab-header">
              <span className="cer-lab-badge">Cellular Energy Panel</span>
              <h3 className="cer-lab-title">12 Targeted Biomarkers</h3>
              <p className="cer-lab-subtitle">Drawn at baseline and week 6 to track your transformation</p>
            </div>
            
            <div className="cer-lab-markers">
              <div className="cer-marker-category">
                <h4>Inflammation</h4>
                <ul>
                  <li>CRP-HS</li>
                  <li>Homocysteine</li>
                </ul>
              </div>
              <div className="cer-marker-category">
                <h4>Oxygen & Iron</h4>
                <ul>
                  <li>CBC (complete)</li>
                  <li>Ferritin</li>
                  <li>Iron/TIBC</li>
                </ul>
              </div>
              <div className="cer-marker-category">
                <h4>Growth Factors</h4>
                <ul>
                  <li>IGF-1</li>
                  <li>DHEA-S</li>
                </ul>
              </div>
              <div className="cer-marker-category">
                <h4>Metabolism</h4>
                <ul>
                  <li>Fasting Insulin</li>
                  <li>HgbA1c</li>
                  <li>Free T3</li>
                  <li>TSH</li>
                  <li>Vitamin D</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* PRICING - VALUE STACK */}
      <section className="cer-section">
        <div className="cer-container">
          <p className="cer-section-kicker">Investment</p>
          <h2 className="cer-section-title">6-Week Reset Pricing</h2>
          <p className="cer-section-subtitle">
            Everything you need to restore your cellular energy. One program. One price.
          </p>
          
          <div className="cer-pricing-section">
            {/* Value Stack */}
            <div className="cer-value-stack">
              <div className="cer-value-header">
                <h3>6-Week Cellular Energy Reset</h3>
                <p>Complete Protocol</p>
              </div>
              
              <div className="cer-value-body">
                <div className="cer-value-item">
                  <span className="cer-value-item-name">18 Hyperbaric Oxygen Sessions (60 min each)</span>
                  <span className="cer-value-item-price">$3,330</span>
                </div>
                <div className="cer-value-item">
                  <span className="cer-value-item-name">18 Full-Body Red Light Sessions (20 min each)</span>
                  <span className="cer-value-item-price">$1,530</span>
                </div>
                <div className="cer-value-item">
                  <span className="cer-value-item-name">2 Cellular Energy Lab Panels</span>
                  <span className="cer-value-item-price">$700</span>
                </div>
                <div className="cer-value-item">
                  <span className="cer-value-item-name">2 Provider Lab Review Visits + Written Plans</span>
                  <span className="cer-value-item-price">$400</span>
                </div>
                <div className="cer-value-item">
                  <span className="cer-value-item-name">Weekly Progress Check-ins & Energy Tracking</span>
                  <span className="cer-value-item-price">$300</span>
                </div>
                <div className="cer-value-item">
                  <span className="cer-value-item-name">Priority Scheduling & Concierge Coordination</span>
                  <span className="cer-value-item-price">$200</span>
                </div>
              </div>
              
              <div className="cer-value-total">
                <div className="cer-value-total-row">
                  <span className="cer-value-total-label">Total Value</span>
                  <span className="cer-value-total-amount">$6,460</span>
                </div>
                <div className="cer-value-total-row">
                  <span className="cer-value-today-label">Your Price Today</span>
                  <span className="cer-value-today-amount">$3,997</span>
                </div>
                <div className="cer-value-savings-row">
                  <span className="cer-value-savings-label">You Save</span>
                  <span className="cer-value-savings-amount">$2,463 (38% off)</span>
                </div>
              </div>
            </div>
            
            {/* Payment Options */}
            <div className="cer-payment-options">
              <div className="cer-payment-card featured">
                <span className="cer-payment-badge">Best Value</span>
                <div className="cer-payment-title">Pay in Full</div>
                <div className="cer-payment-price">$3,997</div>
                <div className="cer-payment-note">One-time payment</div>
                <div className="cer-payment-bonus">+ Bonus: 2 extra Red Light sessions</div>
              </div>
              <div className="cer-payment-card">
                <div className="cer-payment-title">Payment Plan</div>
                <div className="cer-payment-price">3 × $1,450</div>
                <div className="cer-payment-note">$4,350 total</div>
              </div>
            </div>
            
            {/* Guarantee */}
            <div className="cer-guarantee">
              <div className="cer-guarantee-title">🛡️ Our Week-3 Energy Guarantee</div>
              <p className="cer-guarantee-text">
                If your self-rated energy hasn't improved by at least 2 points (on a 1-10 scale) by the end of week 3, we'll add 2 extra weeks of red light therapy (6 sessions) at no charge.
              </p>
            </div>
            
            {/* Scarcity */}
            <div className="cer-scarcity">
              <p className="cer-scarcity-text">
                ⚠️ Limited availability: We can only run 8 Cellular Energy Resets at a time due to chamber capacity. Currently enrolling for this month.
              </p>
            </div>
            
            {/* CTA */}
            <div className="cer-main-cta">
              <a href="sms:+19499973988?body=Hi, I'm interested in the 6-Week Cellular Energy Reset program." className="cer-btn-primary">Reserve Your Spot →</a>
              <p className="cer-cta-subtext">Questions? Text or call (949) 997-3988</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* STEP 3: Maintenance Membership - NEW */}
      <section className="cer-section cer-section-alt">
        <div className="cer-container">
          <p className="cer-section-kicker">Step 3: After Your Reset</p>
          <h2 className="cer-section-title">Maintain Your Results</h2>
          <p className="cer-section-subtitle">
            After your 6-week transformation, keep your gains with our maintenance membership.
          </p>
          
          <div className="cer-maintenance-section">
            <div className="cer-maintenance-header">
              <span className="cer-maintenance-badge">Continuity</span>
              <h3 className="cer-maintenance-title">Cellular Energy Maintenance</h3>
              <p className="cer-maintenance-subtitle">Stay optimized without starting over</p>
            </div>
            
            <div className="cer-maintenance-includes">
              <h4>Every 4 Weeks:</h4>
              <ul>
                <li>4 Hyperbaric Oxygen sessions</li>
                <li>4 Red Light Therapy sessions</li>
                <li>Quarterly mini check-in (10-15 min)</li>
                <li>Annual Cellular Energy Lab Panel at preferred rate</li>
                <li>Priority scheduling</li>
              </ul>
            </div>
            
            <div className="cer-maintenance-pricing">
              <div className="cer-maintenance-price">$597 <span>/ every 4 weeks</span></div>
              <p className="cer-maintenance-compare">À la carte value: $1,080+ per month</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* FAQ */}
      <section className="cer-section">
        <div className="cer-container">
          <p className="cer-section-kicker">Questions</p>
          <h2 className="cer-section-title">Frequently Asked Questions</h2>
          
          <div className="cer-faq-list">
            <div className="cer-faq-item">
              <h3 className="cer-faq-question">Should I start with the Assessment or the full Reset?</h3>
              <p className="cer-faq-answer">If you're unsure whether this is right for you, start with the Cellular Energy Assessment ($497). You'll get your labs, a provider consultation, and a clear picture of your cellular health. If you decide to move forward with the Reset within 7 days, your entire $497 is credited toward the program.</p>
            </div>
            
            <div className="cer-faq-item">
              <h3 className="cer-faq-question">How long does each session take?</h3>
              <p className="cer-faq-answer">Plan for about 90 minutes door-to-door when doing HBOT + Red Light together. Red light is 20 minutes (10 per side), HBOT is 60 minutes. Most people do both therapies back-to-back, 3 times per week.</p>
            </div>
            
            <div className="cer-faq-item">
              <h3 className="cer-faq-question">When will I start feeling results?</h3>
              <p className="cer-faq-answer">Most people notice improved sleep quality within the first 1-2 weeks. Energy improvements typically become noticeable around weeks 2-3. The full benefits continue building through week 6 and beyond. That's why we include the Week-3 guarantee.</p>
            </div>
            
            <div className="cer-faq-item">
              <h3 className="cer-faq-question">What if I miss a session?</h3>
              <p className="cer-faq-answer">Life happens. If you miss a session, we'll work with you to reschedule. Consistency matters, but the protocol is flexible enough to accommodate occasional schedule changes.</p>
            </div>
            
            <div className="cer-faq-item">
              <h3 className="cer-faq-question">Are there any contraindications?</h3>
              <p className="cer-faq-answer">Hyperbaric oxygen therapy isn't recommended for people with certain lung conditions, recent ear surgery, or claustrophobia. We'll review your health history before starting to ensure this protocol is right for you.</p>
            </div>
            
            <div className="cer-faq-item">
              <h3 className="cer-faq-question">What happens after the 6 weeks?</h3>
              <p className="cer-faq-answer">At your Week 7 results review, we'll compare your labs and discuss the Maintenance Membership ($597/4 weeks) to preserve your gains. Most people continue with ongoing sessions to maintain their cellular energy improvements.</p>
            </div>
            
            <div className="cer-faq-item">
              <h3 className="cer-faq-question">How many spots are available?</h3>
              <p className="cer-faq-answer">Due to chamber and bed capacity, we can only run 8 Cellular Energy Resets simultaneously. Each patient uses approximately 24 hours of equipment time over 6 weeks. We encourage you to reach out early to secure your spot.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Final CTA */}
      <section className="cer-section cer-section-alt cer-final-cta">
        <div className="cer-container">
          <h2 className="cer-section-title">Ready to Reset Your Energy?</h2>
          <p className="cer-section-subtitle">
            Start with an Assessment to see your baseline, or jump straight into the 6-Week Reset.
          </p>
          
          <div className="cer-cta-buttons">
            <a href="sms:+19499973988?body=Hi, I'd like to book a Cellular Energy Assessment." className="cer-btn-primary">Book Assessment ($497) →</a>
            <a href="sms:+19499973988?body=Hi, I'm ready to start the 6-Week Cellular Energy Reset." className="cer-btn-outline">Start Full Reset ($3,997) →</a>
          </div>
          
          <p className="cer-cta-phone">Questions? Call <a href="tel:+19499973988">(949) 997-3988</a></p>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="cer-footer">
        <p className="cer-footer-text">© 2026 Range Medical. All rights reserved.</p>
        <p className="cer-footer-links">
          <a href="https://range-medical.com">range-medical.com</a> • 
          <a href="tel:+19499973988">(949) 997-3988</a>
        </p>
      </footer>
    </div>
  );
};

export default CellularEnergyResetLanding;
