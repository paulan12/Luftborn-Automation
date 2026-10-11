import { test, expect } from '../src/fixtures';
import { HomePage } from '../src/pages/HomePage';

// Reproduce the reported overlay interception without depending on eBay timing.
test('an existing shipping popup cannot block destination selection', async ({ page }) => {
  await page.setContent(`
    <input name="_nkw">
    <button class="gh-ship-to__menu" onclick="document.querySelector('[role=dialog]').style.display='block'">Shipping destination</button>
    <div role="dialog" class="address-dialog__lightbox" style="position:fixed;inset:0;background:white;z-index:10">
      <button class="lightbox-dialog__close" onclick="this.parentElement.style.display='none'">Close</button>
      <iframe srcdoc="<label>Country or Region<select><option>Egypt</option><option>United States</option></select></label><label>Zipcode<input></label><button onclick='parent.postMessage({country:document.querySelector(&quot;select&quot;).value,postalCode:document.querySelector(&quot;input&quot;).value},&quot;*&quot;)'>Confirm</button>"></iframe>
    </div>
    <output id="destination"></output>
    <script>
      addEventListener('message', e => {
        document.querySelector('#destination').textContent=e.data.country+' '+e.data.postalCode;
        document.querySelector('[role=dialog]').style.display='none';
      });
    </script>
  `);
  await new HomePage(page).setShippingDestination('United States', '10001');
  await expect(page.locator('#destination')).toHaveText('United States 10001');
  // The normal handler must be restored after intentional dialog interaction.
  await page.locator('[role=dialog]').evaluate(el => { (el as HTMLElement).style.display = 'block'; });
  await page.locator('input[name=_nkw]').fill('handler restored');
  await expect(page.locator('[role=dialog]')).toBeHidden();
});
