#!/bin/bash
clear
echo ""
echo -e "\033[31m Steamcommunity302 For Steam Deck 安装 \033[0m"
dir_=$(pwd)
cd $dir_
echo "当前目录:" $dir_
current_user=$(whoami)
has_root() {
    if [[ $current_user != "root" ]]; then
        echo "权限需要提升:输入root密码以继续执行脚本" 1>&2
        echo "若未设置过root密码请先打开终端输入passwd进行设置" 1>&2
		echo "" 1>&2
		read -p "请输入root密码:" userpasswd
		chmod +x $dir_/install.sh
		echo $userpasswd | sudo -S $dir_/install.sh
		exit 1
    fi
}
has_root

echo "清理旧文件"
rm -f steamcommunity_302.caddy
rm -f s302.run.sh
rm -f steamcommunity_302.service
rm -f /etc/systemd/system/steamcommunity_302.service
rm -f /etc/systemd/system/multi-user.target.wants/steamcommunity_302.service
echo "下载后端程序"
#wget -N -O steamcommunity_302.caddy --no-check-certificate https://caddyserver.com/api/download?os=linux&arch=amd64
#wget -N -O steamcommunity_302.caddy --no-check-certificate https://www.dogfight360.com/Usbeam/caddy_linux_amd64
download_status=$(curl -k -o $dir_/steamcommunity_302.caddy -w "%{http_code}" https://www.dogfight360.com/Usbeam/caddy_linux_amd64)
    if [[ $download_status != 200 ]]; then
	    echo -e "\033[31m 后端程序下载失败,请检查网络并重新执行安装脚本! \033[0m"
	    echo -e "\033[31m 后端程序下载失败,请检查网络并重新执行安装脚本! \033[0m"
	    echo -e "\033[31m 后端程序下载失败,请检查网络并重新执行安装脚本! \033[0m"
		exit 1
    fi
echo "赋予后端程序执行属性"
chmod +x $dir_/steamcommunity_302.caddy
chown deck:deck $dir_/"steamcommunity_302.caddy"
echo "创建服务文件"
cat > steamcommunity_302.service <<EOF
[Unit]
Description=steamcommunity_302
[Service]
ExecStart=$dir_/s302.run.sh
[Install]
WantedBy=multi-user.target
EOF
echo "创建运行脚本"
cat > s302.run.sh <<EOF
#!/bin/sh
cd $dir_
sudo -S $dir_/steamcommunity_302.caddy run --config $dir_/steamcommunity_302.caddy.json --adapter caddyfile
EOF
chown deck:deck $dir_/"s302.run.sh"
chmod +x s302.run.sh
echo "安装服务"
chown deck:deck $dir_/"steamcommunity_302.service"
cp $dir_/steamcommunity_302.service /etc/systemd/system/steamcommunity_302.service -f
chmod +x /etc/systemd/system/steamcommunity_302.service
ln -s $dir_/steamcommunity_302.service /etc/systemd/system/multi-user.target.wants/
echo "备份并写入hosts文件,hosts备份保存于/etc/hosts.backup.*"
mv /etc/hosts /etc/hosts.backup.$(date +%s) -f

echo "安装证书"
cp $dir_/steamcommunityCA.pem /etc/ca-certificates/trust-source/anchors/steamcommunityCA.crt -f
sudo -S trust extract-compat

echo "创建卸载脚本"
cat > $dir_/"uninstall.sh" <<'EOF'
#!/bin/bash
clear
echo ""
echo -e "\033[31m Steamcommunity302 For Steam Deck 卸载 \033[0m"
dir_=$(pwd)
cd $dir_
echo "当前目录:" $dir_
current_user=$(whoami)
has_root() {
    if [[ $current_user != "root" ]]; then
        echo "权限需要提升:输入root密码以继续执行脚本" 1>&2
		echo "" 1>&2
		read -p "请输入root密码:" userpasswd
		echo $userpasswd |sudo -S $dir_/uninstall.sh
		exit 1
    fi
}
has_root
echo "停止服务"
systemctl stop steamcommunity_302.service
echo "删除服务"
rm $dir_/steamcommunity_302.service -f
rm /etc/systemd/system/steamcommunity_302.service -f
rm /etc/systemd/system/multi-user.target.wants/steamcommunity_302.service -f
echo "删除证书"
rm /etc/ca-certificates/trust-source/anchors/steamcommunityCA.crt -f
sudo -S trust extract-compat
echo "备份hosts"
mv /etc/hosts /etc/hosts.backup.$(date +%s) -f
echo "清空hosts"
echo "" > /etc/hosts
echo "刷新系统服务"
systemctl daemon-reload
echo -e "\033[31m 卸载完成,请手动删除目录下残留文件 \033[0m"
EOF

chown deck:deck $dir_/"uninstall.sh"
chmod +x $dir_/"uninstall.sh"
echo "写入hosts"
cat > /etc/hosts <<EOF
127.0.0.1 steamcommunity.com #S302
127.0.0.1 www.steamcommunity.com #S302
127.0.0.1 store.steampowered.com #S302
127.0.0.1 checkout.steampowered.com #S302
127.0.0.1 api.steampowered.com #S302
127.0.0.1 help.steampowered.com #S302
127.0.0.1 login.steampowered.com #S302
127.0.0.1 store.akamai.steamstatic.com #S302
127.0.0.1 discord.com #S302
127.0.0.1 updates.discord.com #S302
127.0.0.1 discordapp.com #S302
127.0.0.1 dl.discordapp.net #S302
127.0.0.1 blog.discord.com #S302
127.0.0.1 medium.com #S302
127.0.0.1 gateway.discord.gg #S302
127.0.0.1 discord.gg #S302
127.0.0.1 media.discordapp.net #S302
127.0.0.1 images-ext-2.discordapp.net #S302
127.0.0.1 images-ext-1.discordapp.net #S302
127.0.0.1 url9177.discordapp.com #S302
127.0.0.1 canary-api.discordapp.com #S302
127.0.0.1 cdn-ptb.discordapp.com #S302
127.0.0.1 ptb.discordapp.com #S302
127.0.0.1 status.discordapp.com #S302
127.0.0.1 cdn-canary.discordapp.com #S302
127.0.0.1 cdn.discordapp.com #S302
127.0.0.1 streamkit.discordapp.com #S302
127.0.0.1 i18n.discordapp.com #S302
127.0.0.1 url9624.discordapp.com #S302
127.0.0.1 url7195.discordapp.com #S302
127.0.0.1 merch.discordapp.com #S302
127.0.0.1 printer.discordapp.com #S302
127.0.0.1 canary.discordapp.com #S302
127.0.0.1 apps.discordapp.com #S302
127.0.0.1 pax.discordapp.com #S302
127.0.0.1 status.discord.com #S302
127.0.0.1 streamkit.discord.com #S302
127.0.0.1 feedback.discord.com #S302
127.0.0.1 click.discord.com #S302
127.0.0.1 pax.discord.com #S302
127.0.0.1 printer.discord.com #S302
127.0.0.1 ptb.discord.com #S302
127.0.0.1 canary.discord.com #S302
127.0.0.1 canary.discord.com #S302
127.0.0.1 bugs.discord.com #S302
127.0.0.1 i18n.discord.com #S302
127.0.0.1 support.discord.com #S302
127.0.0.1 safety.discord.com #S302
127.0.0.1 support-dev.discord.com #S302
127.0.0.1 discord-attachments-uploads-prd.storage.googleapis.com #S302
127.0.0.1 twitch.tv #S302
127.0.0.1 www.twitch.tv #S302
127.0.0.1 m.twitch.tv #S302
127.0.0.1 app.twitch.tv #S302
127.0.0.1 music.twitch.tv #S302
127.0.0.1 blog.twitch.tv #S302
127.0.0.1 inspector.twitch.tv #S302
127.0.0.1 dev.twitch.tv #S302
127.0.0.1 clips.twitch.tv #S302
127.0.0.1 spade.twitch.tv #S302
127.0.0.1 gql.twitch.tv #S302
127.0.0.1 vod-secure.twitch.tv #S302
127.0.0.1 vod-storyboards.twitch.tv #S302
127.0.0.1 trowel.twitch.tv #S302
127.0.0.1 extension-files.twitch.tv #S302
127.0.0.1 vod-metro.twitch.tv #S302
127.0.0.1 player.m7g.twitch.tv #S302
127.0.0.1 help.twitch.tv #S302
127.0.0.1 passport.twitch.tv #S302
127.0.0.1 id.twitch.tv #S302
127.0.0.1 id-cdn.twitch.tv #S302
127.0.0.1 player.twitch.tv #S302
127.0.0.1 api.twitch.tv #S302
127.0.0.1 cvp.twitch.tv #S302
127.0.0.1 pubsub-edge.twitch.tv #S302
127.0.0.1 ingest.twitch.tv #S302
127.0.0.1 assets.help.twitch.tv #S302
127.0.0.1 discuss.dev.twitch.tv #S302
127.0.0.1 irc-ws.chat.twitch.tv #S302
127.0.0.1 irc-ws-r.chat.twitch.tv #S302
127.0.0.1 dashboard.twitch.tv #S302
127.0.0.1 safety.twitch.tv #S302
127.0.0.1 brand.twitch.tv #S302
127.0.0.1 usher.ttvnw.net #S302
127.0.0.1 video-edge-b1f932.pdx01.abs.hls.ttvnw.net #S302
127.0.0.1 steambroadcast.akamaized.net #S302
127.0.0.1 steamvideo-a.akamaihd.net #S302
127.0.0.1 steamstore-a.akamaihd.net #S302
127.0.0.1 steamusercontent-a.akamaihd.net #S302
127.0.0.1 steamcommunity-a.akamaihd.net #S302
127.0.0.1 steamcdn-a.akamaihd.net #S302
127.0.0.1 steamuserimages-a.akamaihd.net #S302
127.0.0.1 community.akamai.steamstatic.com #S302
127.0.0.1 avatars.akamai.steamstatic.com #S302
127.0.0.1 community.steamstatic.com #S302
127.0.0.1 cdn.akamai.steamstatic.com #S302
127.0.0.1 avatars.steamstatic.com #S302
127.0.0.1 cdn.cloudflare.steamstatic.com #S302
127.0.0.1 community.cloudflare.steamstatic.com #S302
127.0.0.1 store.cloudflare.steamstatic.com #S302
127.0.0.1 video.cloudflare.steamstatic.com #S302
127.0.0.1 avatars.cloudflare.steamstatic.com #S302
127.0.0.1 dfs.cloudflare.steamstatic.com #S302
127.0.0.1 clan.cloudflare.steamstatic.com #S302
127.0.0.1 www.google.com #S302
127.0.0.1 steam-chat.com #S302
127.0.0.1 hb.imgix.net #S302
127.0.0.1 fanatical.imgix.net #S302
127.0.0.1 mod.io #S302
127.0.0.1 static.mod.io #S302
127.0.0.1 api.mod.io #S302
127.0.0.1 docs.mod.io #S302
127.0.0.1 snowrunner.mod.io #S302
127.0.0.1 tabs.mod.io #S302
127.0.0.1 skaterxl.mod.io #S302
127.0.0.1 spaceengineers.mod.io #S302
127.0.0.1 mordhau.mod.io #S302
127.0.0.1 insurgencysandstorm.mod.io #S302
127.0.0.1 foundation.mod.io #S302
127.0.0.1 funwithragdolls.mod.io #S302
127.0.0.1 smx.mod.io #S302
127.0.0.1 descenders.mod.io #S302
127.0.0.1 battletalent.mod.io #S302
127.0.0.1 contractors.mod.io #S302
127.0.0.1 dashpanel.mod.io #S302
127.0.0.1 swordsofgargantua.mod.io #S302
127.0.0.1 eco.mod.io #S302
127.0.0.1 abk21.mod.io #S302
127.0.0.1 openxcom.mod.io #S302
127.0.0.1 0ad.mod.io #S302
127.0.0.1 tabletopplayground.mod.io #S302
127.0.0.1 cccp.mod.io #S302
127.0.0.1 playcraft.mod.io #S302
127.0.0.1 aground.mod.io #S302
127.0.0.1 hypnospace.mod.io #S302
127.0.0.1 dusk.mod.io #S302
127.0.0.1 oldworld.mod.io #S302
127.0.0.1 vertex.mod.io #S302
127.0.0.1 meeplestation.mod.io #S302
127.0.0.1 fdwall.mod.io #S302
127.0.0.1 noplanb.mod.io #S302
127.0.0.1 tsg.mod.io #S302
127.0.0.1 songsofsyx.mod.io #S302
127.0.0.1 vinylreality.mod.io #S302
127.0.0.1 hardtimes.mod.io #S302
127.0.0.1 nox.mod.io #S302
127.0.0.1 actortycoon2.mod.io #S302
127.0.0.1 desperados.mod.io #S302
127.0.0.1 dreamsreach.mod.io #S302
127.0.0.1 dk.mod.io #S302
127.0.0.1 bannerlord.mod.io #S302
127.0.0.1 qe.mod.io #S302
127.0.0.1 mpnaf.mod.io #S302
127.0.0.1 ourrepublic.mod.io #S302
127.0.0.1 nuclearwarsimulator.mod.io #S302
127.0.0.1 solasta.mod.io #S302
127.0.0.1 onaroll.mod.io #S302
127.0.0.1 recontainment.mod.io #S302
127.0.0.1 sinespace.mod.io #S302
127.0.0.1 bridge3.mod.io #S302
127.0.0.1 wop.mod.io #S302
127.0.0.1 doodlederby.mod.io #S302
127.0.0.1 megacars.mod.io #S302
127.0.0.1 vrsim.mod.io #S302
127.0.0.1 sketchbots.mod.io #S302
127.0.0.1 holodance.mod.io #S302
127.0.0.1 9nations.mod.io #S302
127.0.0.1 worldofpadman.mod.io #S302
127.0.0.1 artron.mod.io #S302
127.0.0.1 icetemple.mod.io #S302
127.0.0.1 trainsandthings.mod.io #S302
127.0.0.1 goldencreation.mod.io #S302
127.0.0.1 bit.mod.io #S302
127.0.0.1 neanderfall.mod.io #S302
127.0.0.1 jet3d.mod.io #S302
127.0.0.1 mischiefnight.mod.io #S302
127.0.0.1 wardeclarer.mod.io #S302
127.0.0.1 sote.mod.io #S302
127.0.0.1 avisrapida.mod.io #S302
127.0.0.1 openmb.mod.io #S302
127.0.0.1 mondrian.mod.io #S302
127.0.0.1 ghostandsword.mod.io #S302
127.0.0.1 integrate.mod.io #S302
127.0.0.1 sdk.mod.io #S302
127.0.0.1 discord.mod.io #S302
127.0.0.1 test.mod.io #S302
127.0.0.1 drg.mod.io #S302
127.0.0.1 gof.mod.io #S302
127.0.0.1 tap.mod.io #S302
127.0.0.1 qubesaga.mod.io #S302
127.0.0.1 genlauncher.mod.io #S302
127.0.0.1 pipe.mod.io #S302
127.0.0.1 humankind.mod.io #S302
127.0.0.1 superdungeonmaker.mod.io #S302
127.0.0.1 apico.mod.io #S302
127.0.0.1 spacestationdesigner.mod.io #S302
127.0.0.1 bunnydance.mod.io #S302
127.0.0.1 colonization.mod.io #S302
127.0.0.1 shanaq.mod.io #S302
127.0.0.1 synthetik2.mod.io #S302
127.0.0.1 bto.mod.io #S302
127.0.0.1 na1634743852.mod.io #S302
127.0.0.1 bergsbruk.mod.io #S302
127.0.0.1 parkitect.mod.io #S302
127.0.0.1 ab.mod.io #S302
127.0.0.1 floppa.mod.io #S302
127.0.0.1 megaglest.mod.io #S302
127.0.0.1 xio.mod.io #S302
127.0.0.1 trueskate.mod.io #S302
127.0.0.1 pyroworks.mod.io #S302
127.0.0.1 bus21.mod.io #S302
127.0.0.1 shapez.mod.io #S302
127.0.0.1 outbreak.mod.io #S302
127.0.0.1 besiege.mod.io #S302
127.0.0.1 thegrappleproject.mod.io #S302
127.0.0.1 frontline.mod.io #S302
127.0.0.1 unilearn.mod.io #S302
127.0.0.1 perfectgrind.mod.io #S302
127.0.0.1 beta.mod.io #S302
127.0.0.1 blog.mod.io #S302
127.0.0.1 binary.lge.modcdn.io #S302
127.0.0.1 auth.mod.io #S302
127.0.0.1 old.mod.io #S302
127.0.0.1 static.old.mod.io #S302
127.0.0.1 api.old.mod.io #S302
127.0.0.1 docs.old.mod.io #S302
127.0.0.1 snowrunner.old.mod.io #S302
127.0.0.1 tabs.old.mod.io #S302
127.0.0.1 skaterxl.old.mod.io #S302
127.0.0.1 spaceengineers.old.mod.io #S302
127.0.0.1 mordhau.old.mod.io #S302
127.0.0.1 insurgencysandstorm.old.mod.io #S302
127.0.0.1 foundation.old.mod.io #S302
127.0.0.1 funwithragdolls.old.mod.io #S302
127.0.0.1 smx.old.mod.io #S302
127.0.0.1 descenders.old.mod.io #S302
127.0.0.1 battletalent.old.mod.io #S302
127.0.0.1 contractors.old.mod.io #S302
127.0.0.1 dashpanel.old.mod.io #S302
127.0.0.1 swordsofgargantua.old.mod.io #S302
127.0.0.1 eco.old.mod.io #S302
127.0.0.1 abk21.old.mod.io #S302
127.0.0.1 openxcom.old.mod.io #S302
127.0.0.1 0ad.old.mod.io #S302
127.0.0.1 tabletopplayground.old.mod.io #S302
127.0.0.1 cccp.old.mod.io #S302
127.0.0.1 playcraft.old.mod.io #S302
127.0.0.1 aground.old.mod.io #S302
127.0.0.1 hypnospace.old.mod.io #S302
127.0.0.1 dusk.old.mod.io #S302
127.0.0.1 oldworld.old.mod.io #S302
127.0.0.1 vertex.old.mod.io #S302
127.0.0.1 meeplestation.old.mod.io #S302
127.0.0.1 fdwall.old.mod.io #S302
127.0.0.1 noplanb.old.mod.io #S302
127.0.0.1 tsg.old.mod.io #S302
127.0.0.1 songsofsyx.old.mod.io #S302
127.0.0.1 vinylreality.old.mod.io #S302
127.0.0.1 hardtimes.old.mod.io #S302
127.0.0.1 nox.old.mod.io #S302
127.0.0.1 actortycoon2.old.mod.io #S302
127.0.0.1 desperados.old.mod.io #S302
127.0.0.1 dreamsreach.old.mod.io #S302
127.0.0.1 dk.old.mod.io #S302
127.0.0.1 bannerlord.old.mod.io #S302
127.0.0.1 qe.old.mod.io #S302
127.0.0.1 mpnaf.old.mod.io #S302
127.0.0.1 ourrepublic.old.mod.io #S302
127.0.0.1 nuclearwarsimulator.old.mod.io #S302
127.0.0.1 solasta.old.mod.io #S302
127.0.0.1 onaroll.old.mod.io #S302
127.0.0.1 recontainment.old.mod.io #S302
127.0.0.1 sinespace.old.mod.io #S302
127.0.0.1 bridge3.old.mod.io #S302
127.0.0.1 wop.old.mod.io #S302
127.0.0.1 doodlederby.old.mod.io #S302
127.0.0.1 megacars.old.mod.io #S302
127.0.0.1 vrsim.old.mod.io #S302
127.0.0.1 sketchbots.old.mod.io #S302
127.0.0.1 holodance.old.mod.io #S302
127.0.0.1 9nations.old.mod.io #S302
127.0.0.1 worldofpadman.old.mod.io #S302
127.0.0.1 artron.old.mod.io #S302
127.0.0.1 icetemple.old.mod.io #S302
127.0.0.1 trainsandthings.old.mod.io #S302
127.0.0.1 goldencreation.old.mod.io #S302
127.0.0.1 bit.old.mod.io #S302
127.0.0.1 neanderfall.old.mod.io #S302
127.0.0.1 jet3d.old.mod.io #S302
127.0.0.1 mischiefnight.old.mod.io #S302
127.0.0.1 wardeclarer.old.mod.io #S302
127.0.0.1 sote.old.mod.io #S302
127.0.0.1 avisrapida.old.mod.io #S302
127.0.0.1 openmb.old.mod.io #S302
127.0.0.1 mondrian.old.mod.io #S302
127.0.0.1 ghostandsword.old.mod.io #S302
127.0.0.1 integrate.old.mod.io #S302
127.0.0.1 sdk.old.mod.io #S302
127.0.0.1 discord.old.mod.io #S302
127.0.0.1 test.old.mod.io #S302
127.0.0.1 drg.old.mod.io #S302
127.0.0.1 gof.old.mod.io #S302
127.0.0.1 tap.old.mod.io #S302
127.0.0.1 qubesaga.old.mod.io #S302
127.0.0.1 genlauncher.old.mod.io #S302
127.0.0.1 pipe.old.mod.io #S302
127.0.0.1 humankind.old.mod.io #S302
127.0.0.1 superdungeonmaker.old.mod.io #S302
127.0.0.1 apico.old.mod.io #S302
127.0.0.1 spacestationdesigner.old.mod.io #S302
127.0.0.1 bunnydance.old.mod.io #S302
127.0.0.1 colonization.old.mod.io #S302
127.0.0.1 shanaq.old.mod.io #S302
127.0.0.1 synthetik2.old.mod.io #S302
127.0.0.1 bto.old.mod.io #S302
127.0.0.1 na1634743852.old.mod.io #S302
127.0.0.1 bergsbruk.old.mod.io #S302
127.0.0.1 parkitect.old.mod.io #S302
127.0.0.1 ab.old.mod.io #S302
127.0.0.1 floppa.old.mod.io #S302
127.0.0.1 megaglest.old.mod.io #S302
127.0.0.1 xio.old.mod.io #S302
127.0.0.1 trueskate.old.mod.io #S302
127.0.0.1 pyroworks.old.mod.io #S302
127.0.0.1 bus21.old.mod.io #S302
127.0.0.1 shapez.old.mod.io #S302
127.0.0.1 outbreak.old.mod.io #S302
127.0.0.1 besiege.old.mod.io #S302
127.0.0.1 thegrappleproject.old.mod.io #S302
127.0.0.1 frontline.old.mod.io #S302
127.0.0.1 unilearn.old.mod.io #S302
127.0.0.1 perfectgrind.old.mod.io #S302
127.0.0.1 beta.old.mod.io #S302
127.0.0.1 blog.old.mod.io #S302
127.0.0.1 binary.lge.modcdn.io #S302
127.0.0.1 auth.old.mod.io #S302
127.0.0.1 github.com #S302
127.0.0.1 www.github.com #S302
127.0.0.1 gist.github.com #S302
127.0.0.1 api.github.com #S302
127.0.0.1 raw.github.com #S302
127.0.0.1 raw.githubusercontent.com #S302
127.0.0.1 camo.githubusercontent.com #S302
127.0.0.1 cloud.githubusercontent.com #S302
127.0.0.1 avatars.githubusercontent.com #S302
127.0.0.1 avatars0.githubusercontent.com #S302
127.0.0.1 avatars1.githubusercontent.com #S302
127.0.0.1 avatars2.githubusercontent.com #S302
127.0.0.1 avatars3.githubusercontent.com #S302
127.0.0.1 user-images.githubusercontent.com #S302
127.0.0.1 github-releases.githubusercontent.com #S302
127.0.0.1 assets-cdn.github.com #S302
127.0.0.1 github.githubassets.com #S302
127.0.0.1 codeload.github.com #S302
127.0.0.1 pages.github.com #S302
127.0.0.1 help.github.com #S302
127.0.0.1 docs.github.com #S302
127.0.0.1 services.github.com #S302
127.0.0.1 resources.github.com #S302
127.0.0.1 developer.github.com #S302
127.0.0.1 partner.github.com #S302
127.0.0.1 desktop.github.com #S302
127.0.0.1 support.github.com #S302
127.0.0.1 education.github.com #S302
127.0.0.1 enterprise.github.com #S302
127.0.0.1 lab.github.com #S302
127.0.0.1 classroom.github.com #S302
127.0.0.1 central.github.com #S302
127.0.0.1 desktop.githubusercontent.com #S302
127.0.0.1 guides.github.com #S302
127.0.0.1 copilot.github.com #S302
127.0.0.1 github.io #S302
127.0.0.1 www.github.io #S302
127.0.0.1 *.github.io #[Please change the prefix to support github.io] #S302
127.0.0.1 api1.origin.com #S302
127.0.0.1 onedrive.live.com #S302
127.0.0.1 skyapi.onedrive.live.com #S302
127.0.0.1 static.wikia.nocookie.net #S302
127.0.0.1 img.wikia.nocookie.net #S302
127.0.0.1 img1.wikia.nocookie.net #S302
127.0.0.1 img2.wikia.nocookie.net #S302
127.0.0.1 img3.wikia.nocookie.net #S302
127.0.0.1 img4.wikia.nocookie.net #S302
127.0.0.1 img5.wikia.nocookie.net #S302
127.0.0.1 images.wikia.nocookie.net #S302
127.0.0.1 images1.wikia.nocookie.net #S302
127.0.0.1 images2.wikia.nocookie.net #S302
127.0.0.1 images3.wikia.nocookie.net #S302
127.0.0.1 images4.wikia.nocookie.net #S302
127.0.0.1 images5.wikia.nocookie.net #S302
127.0.0.1 vignette.wikia.nocookie.net #S302
127.0.0.1 vignette1.wikia.nocookie.net #S302
127.0.0.1 vignette2.wikia.nocookie.net #S302
127.0.0.1 vignette3.wikia.nocookie.net #S302
127.0.0.1 vignette4.wikia.nocookie.net #S302
127.0.0.1 vignette5.wikia.nocookie.net #S302
127.0.0.1 blockbench.net #S302
127.0.0.1 www.blockbench.net #S302
127.0.0.1 web.blockbench.net #S302
127.0.0.1 steamcloud-ugc.storage.googleapis.com #S302
127.0.0.1 cdn.jsdelivr.net #S302
127.0.0.1 ap-southeast-2-prod-prodpc01-reg-httpping.p76prod.systems #S302
127.0.0.1 us-east-1-prod-prodpc01-reg-httpping.p76prod.systems #S302
127.0.0.1 eu-central-1-prod-prodpc01-reg-httpping.p76prod.systems #S302
127.0.0.1 eu-west-1-prod-prodpc01-reg-httpping.p76prod.systems #S302
127.0.0.1 www.youtube.com #S302
127.0.0.1 xgpuweb.gssv-play-prod.xboxlive.com #S302
127.0.0.1 xsts.auth.xboxlive.com #S302
127.0.0.1 xgpuwebf2p.gssv-play-prod.xboxlive.com #S302
127.0.0.1 xhome.gssv-play-prod.xboxlive.com #S302
127.0.0.1 artstation.com #S302
127.0.0.1 www.artstation.com #S302
127.0.0.1 cdn.artstation.com #S302
127.0.0.1 cdna.artstation.com #S302
127.0.0.1 cdnb.artstation.com #S302
127.0.0.1 cdnc.artstation.com #S302
127.0.0.1 ws.artstation.com #S302
127.0.0.1 pinterest.com #S302
127.0.0.1 www.pinterest.com #S302
127.0.0.1 accounts.pinterest.com #S302
127.0.0.1 accounts-oauth.pinterest.com #S302
127.0.0.1 creator.pinterest.com #S302
127.0.0.1 creators.pinterest.com #S302
127.0.0.1 career.pinterest.com #S302
127.0.0.1 curate.pinterest.com #S302
127.0.0.1 partners.pinterest.com #S302
127.0.0.1 try.pinterest.com #S302
127.0.0.1 asset.pinterest.com #S302
127.0.0.1 cookies.pinterest.com #S302
127.0.0.1 teens.pinterest.com #S302
127.0.0.1 teen.pinterest.com #S302
127.0.0.1 r.pinterest.com #S302
127.0.0.1 ro.pinterest.com #S302
127.0.0.1 eval.pinterest.com #S302
127.0.0.1 pinfluencers.pinterest.com #S302
127.0.0.1 mqtt.pinterest.com #S302
127.0.0.1 prod-about.pinterest.com #S302
127.0.0.1 codeofconduct.pinterest.com #S302
127.0.0.1 create.pinterest.com #S302
127.0.0.1 anket.pinterest.com #S302
127.0.0.1 trk.pinterest.com #S302
127.0.0.1 trk-v4.pinterest.com #S302
127.0.0.1 trk2.pinterest.com #S302
127.0.0.1 publishers.pinterest.com #S302
127.0.0.1 adminapp.pinterest.com #S302
127.0.0.1 community.pinterest.com #S302
127.0.0.1 curators.pinterest.com #S302
127.0.0.1 commerce.pinterest.com #S302
127.0.0.1 developer.pinterest.com #S302
127.0.0.1 toronto.pinterest.com #S302
127.0.0.1 mdp.pinterest.com #S302
127.0.0.1 investor.pinterest.com #S302
127.0.0.1 prod-brand.pinterest.com #S302
127.0.0.1 status.pinterest.com #S302
127.0.0.1 app.pinterest.com #S302
127.0.0.1 positivity.pinterest.com #S302
127.0.0.1 brand.pinterest.com #S302
127.0.0.1 canary.pinterest.com #S302
127.0.0.1 assets.pinterest.com #S302
127.0.0.1 help.pinterest.com #S302
127.0.0.1 business.pinterest.com #S302
127.0.0.1 developers.pinterest.com #S302
127.0.0.1 policy.pinterest.com #S302
127.0.0.1 blog.pinterest.com #S302
127.0.0.1 newsroom.pinterest.com #S302
127.0.0.1 about.pinterest.com #S302
127.0.0.1 engineering.pinterest.com #S302
127.0.0.1 careers.pinterest.com #S302
127.0.0.1 api.pinterest.com #S302
127.0.0.1 ads.pinterest.com #S302
127.0.0.1 ads-mock.pinterest.com #S302
127.0.0.1 analytics.pinterest.com #S302
127.0.0.1 passets-cdn.pinterest.com #S302
127.0.0.1 trends.pinterest.com #S302
127.0.0.1 support.pinterest.com #S302
127.0.0.1 media-cache-ec0.pinterest.com #S302
127.0.0.1 twotwenty.pinterest.com #S302
127.0.0.1 log.pinterest.com #S302
127.0.0.1 media-cache-ec1.pinterest.com #S302
127.0.0.1 post.pinterest.com #S302
127.0.0.1 labs.pinterest.com #S302
127.0.0.1 passets-ec.pinterest.com #S302
127.0.0.1 wellbeing.pinterest.com #S302
127.0.0.1 widgets.pinterest.com #S302
127.0.0.1 thepoint.pinterest.com #S302
127.0.0.1 catalogs.pinterest.com #S302
127.0.0.1 passets-ak.pinterest.com #S302
127.0.0.1 passets.pinterest.com #S302
127.0.0.1 latest.pinterest.com #S302
127.0.0.1 partners-api.pinterest.com #S302
127.0.0.1 dev.pinterest.com #S302
127.0.0.1 pinterest.jp #S302
127.0.0.1 www.pinterest.jp #S302
127.0.0.1 pinterest.kr #S302
127.0.0.1 www.pinterest.kr #S302
127.0.0.1 pinterest.info #S302
127.0.0.1 www.pinterest.info #S302
127.0.0.1 pinimg.com #S302
127.0.0.1 s.pinimg.com #S302
127.0.0.1 i.pinimg.com #S302
127.0.0.1 i2.pinimg.com #S302
127.0.0.1 sm.pinimg.com #S302
127.0.0.1 v.pinimg.com #S302
127.0.0.1 v1.pinimg.com #S302
127.0.0.1 v2.pinimg.com #S302
127.0.0.1 v3.pinimg.com #S302
127.0.0.1 h2.pinimg.com #S302
127.0.0.1 u.pinimg.com #S302
127.0.0.1 u2.pinimg.com #S302
127.0.0.1 s-media-cache-ak0.pinimg.com #S302
127.0.0.1 media-cache-ak0.pinimg.com #S302
127.0.0.1 media-cache-ec0.pinimg.com #S302
127.0.0.1 media-cache-cd0.pinimg.com #S302
127.0.0.1 media-cache-ak1.pinimg.com #S302
127.0.0.1 media-cache-ak2.pinimg.com #S302
127.0.0.1 s-media-cache-ec0.pinimg.com #S302
127.0.0.1 s-passets-ec.pinimg.com #S302
127.0.0.1 media-cache-ec2.pinimg.com #S302
127.0.0.1 media-cache-ec3.pinimg.com #S302
127.0.0.1 media-cache-ec4.pinimg.com #S302
127.0.0.1 i-h2.pinimg.com #S302
127.0.0.1 media-cache-ak3.pinimg.com #S302
127.0.0.1 i-h1.pinimg.com #S302
127.0.0.1 s-passets-cache-ak0.pinimg.com #S302
127.0.0.1 s-passets.pinimg.com #S302
127.0.0.1 media-cache-ec1.pinimg.com #S302
127.0.0.1 imgur.com #S302
127.0.0.1 www.imgur.com #S302
127.0.0.1 api.imgur.com #S302
127.0.0.1 i.imgur.com #S302
127.0.0.1 s.imgur.com #S302
127.0.0.1 t.imgur.com #S302
127.0.0.1 rt.imgur.com #S302
127.0.0.1 i.stack.imgur.com #S302
127.0.0.1 p.imgur.com #S302
127.0.0.1 m.imgur.com #S302
127.0.0.1 blog.imgur.com #S302
127.0.0.1 steamcloud-eu-ams.storage.googleapis.com #S302
127.0.0.1 steamcloud-eu-fra.storage.googleapis.com #S302
127.0.0.1 steamcloud-finland.storage.googleapis.com #S302
127.0.0.1 steamcloud-saopaulo.storage.googleapis.com #S302
127.0.0.1 steamcloud-singapore.storage.googleapis.com #S302
127.0.0.1 steamcloud-sydney.storage.googleapis.com #S302
127.0.0.1 steamcloud-taiwan.storage.googleapis.com #S302
127.0.0.1 steamcloud-eu.storage.googleapis.com #S302
127.0.0.1 ajax.googleapis.com #S302
127.0.0.1 assets1.xboxlive.com #S302
127.0.0.1 assets2.xboxlive.com #S302
127.0.0.1 xvcf1.xboxlive.com #S302
127.0.0.1 xvcf2.xboxlive.com #S302
127.0.0.1 download.epicgames.com #S302
127.0.0.1 download2.epicgames.com #S302
127.0.0.1 download3.epicgames.com #S302
127.0.0.1 download4.epicgames.com #S302
127.0.0.1 epicgames-download1.akamaized.net #S302
127.0.0.1 fastly-download.epicgames.com #S302

EOF

echo "创建日志查看脚本"
cat > $dir_/"log.sh" <<EOF
journalctl -u steamcommunity_302.service -f -n 100
EOF

chown deck:deck $dir_/"log.sh"
chmod +x $dir_/"log.sh"
echo "启动服务"
systemctl daemon-reload
systemctl stop steamcommunity_302.service
systemctl start steamcommunity_302.service

echo -e "\033[31m -------程序以当前目录程序运行,请勿删除当前目录!-------- \033[0m"
echo -e "\033[31m ------------------------------------------------------- \033[0m"
echo -e "\033[31m -----------安装完成已完成,可直接关闭该窗口!------------ \033[0m"
