// ==UserScript==
// @name         Majsoul Helper + River Indication
// @namespace    https://github.com/Fr0stbyteR/
// @version      0.2.3
// @description  dye recommended discarding tile with tenhou/2 + River tiles indication
// @author       Fr0stbyteR, FlyingBamboo
// @match        https://majsoul.union-game.com/0/
// @grant        none
// ==/UserScript==
(function() {
    'use strict';

    /////////////////////////////////////////////////////////////////////////////////////////////////////
    // TENHOU.NET (C)C-EGG http://tenhou.net/
    /////////////////////////////////////////////////////////////////////////////////////////////////////
    var MPSZ = {
        aka: true,
        fromHai136: function(hai136) {
            var a = (hai136 >> 2);
            if (!this.aka) return ((a % 9) + 1) + "mpsz".substr(a / 9, 1);
            return (a < 27 && (hai136 % 36) == 16 ? "0" : ((a % 9) + 1)) + "mpsz".substr(a / 9, 1);
        },
        expand: function(t) {
            return t
                .replace(/(\d)(\d{0,8})(\d{0,8})(\d{0,8})(\d{0,8})(\d{0,8})(\d{0,8})(\d{8})(m|p|s|z)/g, "$1$9$2$9$3$9$4$9$5$9$6$9$7$9$8$9")
                .replace(/(\d?)(\d?)(\d?)(\d?)(\d?)(\d?)(\d)(\d)(m|p|s|z)/g, "$1$9$2$9$3$9$4$9$5$9$6$9$7$9$8$9") // 57???A???????
                .replace(/(m|p|s|z)(m|p|s|z)+/g, "$1")
                .replace(/^[^\d]/, "");
        },
        contract: function(t) {
            return t
                .replace(/\d(m|p|s|z)(\d\1)*/g, "$&:")
                .replace(/(m|p|s|z)([^:])/g, "$2")
                .replace(/:/g, "");
        },
        exsort: function(t) {
            return t
                .replace(/(\d)(m|p|s|z)/g, "$2$1$1,")
                .replace(/00/g, "50")
                .split(",").sort().join("")
                .replace(/(m|p|s|z)\d(\d)/g, "$2$1");
        },
        exextract136: function(t) {
            var s = t
                .replace(/(\d)m/g, "0$1")
                .replace(/(\d)p/g, "1$1")
                .replace(/(\d)s/g, "2$1")
                .replace(/(\d)z/g, "3$1");
            var i, c = new Array(136);
            for (i = 0; i < s.length; i += 2) {
                var n = s.substr(i, 2),
                    k = -1;
                if (n % 10) {
                    var b = (9 * Math.floor(n / 10) + ((n % 10) - 1)) * 4;
                    k = (!c[b + 3] ? b + 3 : !c[b + 2] ? b + 2 : !c[b + 1] ? b + 1 : b);
                } else {
                    k = (9 * n / 10 + 4) * 4 + 0; // aka5
                }
                if (c[k]) console.error("err n=" + n + " k=" + k + "<br>");
                c[k] = 1;
            }
            return c;
        },
        exextract34: function(t) {
            var s = t
                .replace(/(\d)m/g, "0$1")
                .replace(/(\d)p/g, "1$1")
                .replace(/(\d)s/g, "2$1")
                .replace(/(\d)z/g, "3$1");
            var i, c = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            for (i = 0; i < s.length; i += 2) {
                var n = s.substr(i, 2),
                    k = -1;
                if (n % 10) {
                    k = 9 * Math.floor(n / 10) + ((n % 10) - 1);
                } else {
                    k = 9 * n / 10 + 4; // aka5
                }
                if (c[k] > 4) console.error("err n=" + n + " k=" + k + "<br>");
                c[k]++;
            }
            return c;
        },
        compile136: function(c) {
            var i, s = "";
            for (i = 0; i < 136; ++i)
                if (c[i]) s += MPSZ.fromHai136(i);
            return s;
        }
    };


    /////////////////////////////////////////////////////////////////////////////////////////////////////
    // TENHOU.NET (C)C-EGG http://tenhou.net/
    /////////////////////////////////////////////////////////////////////////////////////////////////////
    function AGARIPATTERN() {
        this.toitsu34 = [-1, -1, -1, -1, -1, -1, -1];
        this.v = [{
            atama34: -1,
            mmmm35: 0
        }, {
            atama34: -1,
            mmmm35: 0
        }, {
            atama34: -1,
            mmmm35: 0
        }, {
            atama34: -1,
            mmmm35: 0
        }]; // 一般形の面子の取り方は高々４つ
        // mmmm35=( 21(順子)+34(暗刻)+34(槓子)+1(ForZeroInvalid) )*0x01010101 | 0x80808080(喰い)
    }
    AGARIPATTERN.prototype = {
        //    isKokushi:function(){return this.v[0].mmmm35==0xFFFFFFFF;},
        //    isChiitoi:function(){return this.v[3].mmmm35==0xFFFFFFFF;},

        cc2m: function(c, d) {
            return (c[d + 0] << 0) | (c[d + 1] << 3) | (c[d + 2] << 6) |
                (c[d + 3] << 9) | (c[d + 4] << 12) | (c[d + 5] << 15) |
                (c[d + 6] << 18) | (c[d + 7] << 21) | (c[d + 8] << 24);
        },
        getAgariPattern: function(c, n) {
            if (n != 34) return false;
            var e = this;
            var v = e.v;
            var j = (1 << c[27]) | (1 << c[28]) | (1 << c[29]) | (1 << c[30]) | (1 << c[31]) | (1 << c[32]) | (1 << c[33]);
            if (j >= 0x10) return false; // 字牌が４枚
            // 国士無双 // １４枚のみ
            if (((j & 3) == 2) && (c[0] * c[8] * c[9] * c[17] * c[18] * c[26] * c[27] * c[28] * c[29] * c[30] * c[31] * c[32] * c[33] == 2)) {
                var i, a = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];
                for (i = 0; i < 13; ++i)
                    if (c[a[i]] == 2) break;
                v[0].atama34 = a[i];
                v[0].mmmm35 = 0xFFFFFFFF;
                return true;
            }
            if (j & 2) return false; // 字牌が１枚
            var ok = false;
            // 七対子 // １４枚のみ
            if (!(j & 10) && (
                    (c[0] == 2) + (c[1] == 2) + (c[2] == 2) + (c[3] == 2) + (c[4] == 2) + (c[5] == 2) + (c[6] == 2) + (c[7] == 2) + (c[8] == 2) +
                    (c[9] == 2) + (c[10] == 2) + (c[11] == 2) + (c[12] == 2) + (c[13] == 2) + (c[14] == 2) + (c[15] == 2) + (c[16] == 2) + (c[17] == 2) +
                    (c[18] == 2) + (c[19] == 2) + (c[20] == 2) + (c[21] == 2) + (c[22] == 2) + (c[23] == 2) + (c[24] == 2) + (c[25] == 2) + (c[26] == 2) +
                    (c[27] == 2) + (c[28] == 2) + (c[29] == 2) + (c[30] == 2) + (c[31] == 2) + (c[32] == 2) + (c[33] == 2)) == 7) {
                v[3].mmmm35 = 0xFFFFFFFF;
                var i, n = 0;
                for (i = 0; i < 34; ++i)
                    if (c[i] == 2) e.toitsu34[n] = i, n += 1;
                ok = true;
                // 二盃口へ
            }
            // 一般形
            var n00 = c[0] + c[3] + c[6],
                n01 = c[1] + c[4] + c[7],
                n02 = c[2] + c[5] + c[8];
            var n10 = c[9] + c[12] + c[15],
                n11 = c[10] + c[13] + c[16],
                n12 = c[11] + c[14] + c[17];
            var n20 = c[18] + c[21] + c[24],
                n21 = c[19] + c[22] + c[25],
                n22 = c[20] + c[23] + c[26];
            var k0 = (n00 + n01 + n02) % 3;
            if (k0 == 1) return ok; // 余る
            var k1 = (n10 + n11 + n12) % 3;
            if (k1 == 1) return ok; // 余る
            var k2 = (n20 + n21 + n22) % 3;
            if (k2 == 1) return ok; // 余る
            if ((k0 == 2) + (k1 == 2) + (k2 == 2) +
                (c[27] == 2) + (c[28] == 2) + (c[29] == 2) + (c[30] == 2) +
                (c[31] == 2) + (c[32] == 2) + (c[33] == 2) != 1) return ok; // 頭の場所は１つ
            if (j & 8) { // 字牌３枚
                if (c[27] == 3) v[0].mmmm35 <<= 8, v[0].mmmm35 |= 21 + 27 + 1;
                if (c[28] == 3) v[0].mmmm35 <<= 8, v[0].mmmm35 |= 21 + 28 + 1;
                if (c[29] == 3) v[0].mmmm35 <<= 8, v[0].mmmm35 |= 21 + 29 + 1;
                if (c[30] == 3) v[0].mmmm35 <<= 8, v[0].mmmm35 |= 21 + 30 + 1;
                if (c[31] == 3) v[0].mmmm35 <<= 8, v[0].mmmm35 |= 21 + 31 + 1;
                if (c[32] == 3) v[0].mmmm35 <<= 8, v[0].mmmm35 |= 21 + 32 + 1;
                if (c[33] == 3) v[0].mmmm35 <<= 8, v[0].mmmm35 |= 21 + 33 + 1;
            }
            var n0 = n00 + n01 + n02,
                kk0 = (n00 * 1 + n01 * 2) % 3,
                m0 = e.cc2m(c, 0);
            var n1 = n10 + n11 + n12,
                kk1 = (n10 * 1 + n11 * 2) % 3,
                m1 = e.cc2m(c, 9);
            var n2 = n20 + n21 + n22,
                kk2 = (n20 * 1 + n21 * 2) % 3,
                m2 = e.cc2m(c, 18);
            //        document.write("n="+n0+" "+n1+" "+n2+" k="+k0+" "+k1+" "+k2+" kk="+kk0+" "+kk1+" "+kk2+" mmmm="+v[0].mmmm35+"<br>");
            if (j & 4) { // 字牌が頭
                if (k0 | kk0 | k1 | kk1 | k2 | kk2) return ok;
                if (c[27] == 2) v[0].atama34 = 27;
                else if (c[28] == 2) v[0].atama34 = 28;
                else if (c[29] == 2) v[0].atama34 = 29;
                else if (c[30] == 2) v[0].atama34 = 30;
                else if (c[31] == 2) v[0].atama34 = 31;
                else if (c[32] == 2) v[0].atama34 = 32;
                else if (c[33] == 2) v[0].atama34 = 33;
                if (n0 >= 9) {
                    if (e.GetMentsu(1, m1) && e.GetMentsu(2, m2) && e.GetMentsu9Fin(0, m0)) return true;
                } else if (n1 >= 9) {
                    if (e.GetMentsu(2, m2) && e.GetMentsu(0, m0) && e.GetMentsu9Fin(1, m1)) return true;
                } else if (n2 >= 9) {
                    if (e.GetMentsu(0, m0) && e.GetMentsu(1, m1) && e.GetMentsu9Fin(2, m2)) return true;
                } else if (e.GetMentsu(0, m0) && e.GetMentsu(1, m1) && e.GetMentsu(2, m2)) return true; // 一意
            } else if (k0 == 2) { // 萬子が頭
                if (k1 | kk1 | k2 | kk2) return ok;
                if (n0 >= 8) {
                    if (e.GetMentsu(1, m1) && e.GetMentsu(2, m2) && e.GetAtamaMentsu8Fin(kk0, 0, m0)) return true;
                } else if (n1 >= 9) {
                    if (e.GetMentsu(2, m2) && e.GetAtamaMentsu(kk0, 0, m0) && e.GetMentsu9Fin(1, m1)) return true;
                } else if (n2 >= 9) {
                    if (e.GetAtamaMentsu(kk0, 0, m0) && e.GetMentsu(1, m1) && e.GetMentsu9Fin(2, m2)) return true;
                } else if (e.GetMentsu(1, m1) && e.GetMentsu(2, m2) && e.GetAtamaMentsu(kk0, 0, m0)) return true; // 一意
            } else if (k1 == 2) { // 筒子が頭
                if (k2 | kk2 | k0 | kk0) return ok;
                if (n1 >= 8) {
                    if (e.GetMentsu(2, m2) && e.GetMentsu(0, m0) && e.GetAtamaMentsu8Fin(kk1, 1, m1)) return true;
                } else if (n2 >= 9) {
                    if (e.GetMentsu(0, m0) && e.GetAtamaMentsu(kk1, 1, m1) && e.GetMentsu9Fin(2, m2)) return true;
                } else if (n0 >= 9) {
                    if (e.GetAtamaMentsu(kk1, 1, m1) && e.GetMentsu(2, m2) && e.GetMentsu9Fin(0, m0)) return true;
                } else if (e.GetMentsu(2, m2) && e.GetMentsu(0, m0) && e.GetAtamaMentsu(kk1, 1, m1)) return true; // 一意
            } else if (k2 == 2) { // 索子が頭
                if (k0 | kk0 | k1 | kk1) return ok;
                if (n2 >= 8) {
                    if (e.GetMentsu(0, m0) && e.GetMentsu(1, m1) && e.GetAtamaMentsu8Fin(kk2, 2, m2)) return true;
                } else if (n0 >= 9) {
                    if (e.GetMentsu(1, m1) && e.GetAtamaMentsu(kk2, 2, m2) && e.GetMentsu9Fin(0, m0)) return true;
                } else if (n1 >= 9) {
                    if (e.GetAtamaMentsu(kk2, 2, m2) && e.GetMentsu(0, m0) && e.GetMentsu9Fin(1, m1)) return true;
                } else if (e.GetMentsu(0, m0) && e.GetMentsu(1, m1) && e.GetAtamaMentsu(kk2, 2, m2)) return true; // 一意
            }
            v[0].mmmm35 = 0; // 一般形不発
            return ok;
        },

        // private:
        GetMentsu: function(col, m) { // ６枚以下は一意
            var e = this;
            var mmmm = e.v[0].mmmm35;
            var i, a = (m & 7),
                b = 0,
                c = 0;
            for (i = 0; i < 7; ++i) {
                switch (a) {
                    case 4:
                        mmmm <<= 16, mmmm |= ((21 + col * 9 + i + 1) << 8) | (col * 7 + i + 1), b += 1, c += 1;
                        break;
                    case 3:
                        mmmm <<= 8, mmmm |= (21 + col * 9 + i + 1);
                        break;
                    case 2:
                        mmmm <<= 16, mmmm |= (col * 7 + i + 1) * 0x0101, b += 2, c += 2;
                        break;
                    case 1:
                        mmmm <<= 8, mmmm |= (col * 7 + i + 1), b += 1, c += 1;
                        break;
                    case 0:
                        break;
                    default:
                        return false;
                }
                m >>= 3, a = (m & 7) - b, b = c, c = 0;
            }
            if (a == 3) mmmm <<= 8, mmmm |= (21 + col * 9 + 7 + 1);
            else if (a) return false; // ⑧
            m >>= 3, a = (m & 7) - b;
            if (a == 3) mmmm <<= 8, mmmm |= (21 + col * 9 + 8 + 1);
            else if (a) return false; // ⑨
            e.v[0].mmmm35 = mmmm;
            //        DBGPRINT((_T("GetMentsu col=%d mmmm=%X\r\n"),col,mmmm));
            return true;
        },
        GetAtamaMentsu: function(nn, col, m) { // ５枚以下は一意
            var e = this;
            var a = (7 << (24 - nn * 3));
            var b = (2 << (24 - nn * 3));
            if ((m & a) >= b && e.GetMentsu(col, m - b)) return e.v[0].atama34 = col * 9 + 8 - nn, true;
            a >>= 9, b >>= 9;
            if ((m & a) >= b && e.GetMentsu(col, m - b)) return e.v[0].atama34 = col * 9 + 5 - nn, true;
            a >>= 9, b >>= 9;
            if ((m & a) >= b && e.GetMentsu(col, m - b)) return e.v[0].atama34 = col * 9 + 2 - nn, true;
            return false;
        },
        GetMentsu9: function(mmmm, col, m, v) { // const // ９枚以上
            // 面子選択は四連刻（１２枚）三連刻（９枚以上）しかない
            var s = -1; // 三連刻
            var i, a = (m & 7),
                b = 0,
                c = 0;
            for (i = 0; i < 7; ++i) {
                if (m == 0x6DB) break; // 四連刻 // 三暗対々が高目 // １２枚のみ
                switch (a) {
                    case 4:
                        mmmm <<= 8, mmmm |= (col * 7 + i + 1), b += 1, c += 1; // nobreak // 平和二盃口が三暗刻より高目
                    case 3: // 帯幺九系が高目、ロン平和一盃口以外は三暗刻が高目
                        if (((m >> 3) & 7) >= 3 + b && ((m >> 6) & 7) >= 3 + c) s = i, b += 3, c += 3; // 三連刻
                        else mmmm <<= 8, mmmm |= (21 + col * 9 + i + 1);
                        break;
                    case 2:
                        mmmm <<= 16, mmmm |= (col * 7 + i + 1) * 0x0101, b += 2, c += 2;
                        break;
                    case 1:
                        mmmm <<= 8, mmmm |= (col * 7 + i + 1), b += 1, c += 1;
                        break;
                    case 0:
                        break;
                    default:
                        return 0;
                }
                m >>= 3, a = (m & 7) - b, b = c, c = 0;
            }
            if (i < 7) { // 四連刻を展開
                v[0] = (21 + col * 9 + i + 1) * 0x01010101 + 0x00010203;
                v[1] = (col * 7 + i + 1 + 1) * 0x010101 | (21 + col * 9 + i + 0 + 1) << 24;
                v[2] = (col * 7 + i + 0 + 1) * 0x010101 | (21 + col * 9 + i + 3 + 1) << 24;
                return 3;
            }
            if (a == 3) mmmm <<= 8, mmmm |= (21 + col * 9 + 7 + 1);
            else if (a) return 0; // ⑧
            m >>= 3, a = (m & 7) - b;
            if (a == 3) mmmm <<= 8, mmmm |= (21 + col * 9 + 8 + 1);
            else if (a) return 0; // ⑨

            if (s != -1) { // 三連刻を展開
                mmmm <<= 24;
                v[0] = mmmm | ((21 + col * 9 + s + 1) * 0x010101 + 0x000102);
                v[1] = mmmm | ((col * 7 + s + 1) * 0x010101);
                v[2] = 0;
                return 2;
            }
            v[0] = mmmm, v[1] = v[2] = 0;
            return 1;
        },
        GetMentsu9Fin: function(col, m) { // ９枚以上
            var e = this;
            var v = e.v;
            var mm = [0, 0, 0];
            if (!e.GetMentsu9(v[0].mmmm35, col, m, mm)) return false;
            var n = 0;
            if (mm[0]) v[n].atama34 = v[0].atama34, v[n].mmmm35 = mm[0], ++n;
            if (mm[1]) v[n].atama34 = v[0].atama34, v[n].mmmm35 = mm[1], ++n;
            if (mm[2]) v[n].atama34 = v[0].atama34, v[n].mmmm35 = mm[2], ++n;
            //        document.write("GetMentsu9Fin col="+col+" n="+n+"<br>");
            return n != 0;
        },
        GetAtamaMentsu8Fin: function(nn, col, m) { // ８枚以上
            var e = this;
            var v = e.v;
            var mmmm = v[0].mmmm35;
            var mm = [0, 0, 0];
            var a = (7 << (24 - nn * 3));
            var b = (2 << (24 - nn * 3));
            var n = 0;
            if ((m & a) >= b && e.GetMentsu9(mmmm, col, m - b, mm)) {
                if (mm[0]) v[n].atama34 = col * 9 + 8 - nn, v[n].mmmm35 = mm[0], ++n;
                if (mm[1]) v[n].atama34 = col * 9 + 8 - nn, v[n].mmmm35 = mm[1], ++n;
                if (mm[2]) v[n].atama34 = col * 9 + 8 - nn, v[n].mmmm35 = mm[2], ++n;
            }
            a >>= 9, b >>= 9;
            if ((m & a) >= b && e.GetMentsu9(mmmm, col, m - b, mm)) {
                if (mm[0]) v[n].atama34 = col * 9 + 5 - nn, v[n].mmmm35 = mm[0], ++n;
                if (mm[1]) v[n].atama34 = col * 9 + 5 - nn, v[n].mmmm35 = mm[1], ++n;
                if (mm[2]) v[n].atama34 = col * 9 + 5 - nn, v[n].mmmm35 = mm[2], ++n;
            }
            a >>= 9, b >>= 9;
            if ((m & a) >= b && e.GetMentsu9(mmmm, col, m - b, mm)) {
                if (mm[0]) v[n].atama34 = col * 9 + 2 - nn, v[n].mmmm35 = mm[0], ++n;
                if (mm[1]) v[n].atama34 = col * 9 + 2 - nn, v[n].mmmm35 = mm[1], ++n;
                if (mm[2]) v[n].atama34 = col * 9 + 2 - nn, v[n].mmmm35 = mm[2], ++n;
            }
            //        document.write("GetAtamaMentsu8Fin col="+col+" n="+n+"<br>");
            return n != 0;
        }
    };

    /////////////////////////////////////////////////////////////////////////////////////////////////////
    // TENHOU.NET (C)C-EGG http://tenhou.net/
    /////////////////////////////////////////////////////////////////////////////////////////////////////
    var AGARI = { // 和了判定のみ // SYANTENで-1検査より高速
        isMentsu: function(m) {
            var a = (m & 7),
                b = 0,
                c = 0;
            if (a == 1 || a == 4) b = c = 1;
            else if (a == 2) b = c = 2;
            m >>= 3, a = (m & 7) - b;
            if (a < 0) return false;
            b = c, c = 0;
            if (a == 1 || a == 4) b += 1, c += 1;
            else if (a == 2) b += 2, c += 2;
            m >>= 3, a = (m & 7) - b;
            if (a < 0) return false;
            b = c, c = 0;
            if (a == 1 || a == 4) b += 1, c += 1;
            else if (a == 2) b += 2, c += 2;
            m >>= 3, a = (m & 7) - b;
            if (a < 0) return false;
            b = c, c = 0;
            if (a == 1 || a == 4) b += 1, c += 1;
            else if (a == 2) b += 2, c += 2;
            m >>= 3, a = (m & 7) - b;
            if (a < 0) return false;
            b = c, c = 0;
            if (a == 1 || a == 4) b += 1, c += 1;
            else if (a == 2) b += 2, c += 2;
            m >>= 3, a = (m & 7) - b;
            if (a < 0) return false;
            b = c, c = 0;
            if (a == 1 || a == 4) b += 1, c += 1;
            else if (a == 2) b += 2, c += 2;
            m >>= 3, a = (m & 7) - b;
            if (a < 0) return false;
            b = c, c = 0;
            if (a == 1 || a == 4) b += 1, c += 1;
            else if (a == 2) b += 2, c += 2;
            m >>= 3, a = (m & 7) - b;
            if (a != 0 && a != 3) return false;
            m >>= 3, a = (m & 7) - c;
            return a == 0 || a == 3;
        },
        isAtamaMentsu: function(nn, m) {
            if (nn == 0) {
                if ((m & (7 << 6)) >= (2 << 6) && this.isMentsu(m - (2 << 6))) return true;
                if ((m & (7 << 15)) >= (2 << 15) && this.isMentsu(m - (2 << 15))) return true;
                if ((m & (7 << 24)) >= (2 << 24) && this.isMentsu(m - (2 << 24))) return true;
            } else if (nn == 1) {
                if ((m & (7 << 3)) >= (2 << 3) && this.isMentsu(m - (2 << 3))) return true;
                if ((m & (7 << 12)) >= (2 << 12) && this.isMentsu(m - (2 << 12))) return true;
                if ((m & (7 << 21)) >= (2 << 21) && this.isMentsu(m - (2 << 21))) return true;
            } else if (nn == 2) {
                if ((m & (7 << 0)) >= (2 << 0) && this.isMentsu(m - (2 << 0))) return true;
                if ((m & (7 << 9)) >= (2 << 9) && this.isMentsu(m - (2 << 9))) return true;
                if ((m & (7 << 18)) >= (2 << 18) && this.isMentsu(m - (2 << 18))) return true;
            }
            return false;
        },
        cc2m: function(c, d) {
            return (c[d + 0] << 0) | (c[d + 1] << 3) | (c[d + 2] << 6) |
                (c[d + 3] << 9) | (c[d + 4] << 12) | (c[d + 5] << 15) |
                (c[d + 6] << 18) | (c[d + 7] << 21) | (c[d + 8] << 24);
        },
        isAgari: function(c) {
            var j = (1 << c[27]) | (1 << c[28]) | (1 << c[29]) | (1 << c[30]) | (1 << c[31]) | (1 << c[32]) | (1 << c[33]);
            if (j >= 0x10) return false; // 字牌が４枚
            // 国士無双 // １４枚のみ
            if (((j & 3) == 2) && (c[0] * c[8] * c[9] * c[17] * c[18] * c[26] * c[27] * c[28] * c[29] * c[30] * c[31] * c[32] * c[33] == 2)) return true;
            // 七対子 // １４枚のみ
            if (!(j & 10) && (
                    (c[0] == 2) + (c[1] == 2) + (c[2] == 2) + (c[3] == 2) + (c[4] == 2) + (c[5] == 2) + (c[6] == 2) + (c[7] == 2) + (c[8] == 2) +
                    (c[9] == 2) + (c[10] == 2) + (c[11] == 2) + (c[12] == 2) + (c[13] == 2) + (c[14] == 2) + (c[15] == 2) + (c[16] == 2) + (c[17] == 2) +
                    (c[18] == 2) + (c[19] == 2) + (c[20] == 2) + (c[21] == 2) + (c[22] == 2) + (c[23] == 2) + (c[24] == 2) + (c[25] == 2) + (c[26] == 2) +
                    (c[27] == 2) + (c[28] == 2) + (c[29] == 2) + (c[30] == 2) + (c[31] == 2) + (c[32] == 2) + (c[33] == 2)) == 7) return true;
            // 一般系
            if (j & 2) return false; // 字牌が１枚
            var n00 = c[0] + c[3] + c[6],
                n01 = c[1] + c[4] + c[7],
                n02 = c[2] + c[5] + c[8];
            var n10 = c[9] + c[12] + c[15],
                n11 = c[10] + c[13] + c[16],
                n12 = c[11] + c[14] + c[17];
            var n20 = c[18] + c[21] + c[24],
                n21 = c[19] + c[22] + c[25],
                n22 = c[20] + c[23] + c[26];
            var n0 = (n00 + n01 + n02) % 3;
            if (n0 == 1) return false; // 萬子が１枚余る
            var n1 = (n10 + n11 + n12) % 3;
            if (n1 == 1) return false; // 筒子が１枚余る
            var n2 = (n20 + n21 + n22) % 3;
            if (n2 == 1) return false; // 索子が１枚余る
            if ((n0 == 2) + (n1 == 2) + (n2 == 2) +
                (c[27] == 2) + (c[28] == 2) + (c[29] == 2) + (c[30] == 2) +
                (c[31] == 2) + (c[32] == 2) + (c[33] == 2) != 1) return false; // 頭の場所は１つ
            var nn0 = (n00 * 1 + n01 * 2) % 3,
                m0 = this.cc2m(c, 0);
            var nn1 = (n10 * 1 + n11 * 2) % 3,
                m1 = this.cc2m(c, 9);
            var nn2 = (n20 * 1 + n21 * 2) % 3,
                m2 = this.cc2m(c, 18);
            if (j & 4) return !(n0 | nn0 | n1 | nn1 | n2 | nn2) && this.isMentsu(m0) && this.isMentsu(m1) && this.isMentsu(m2); // 字牌が頭
            //        document.write("c="+c+"<br>");
            //        document.write("n="+n0+","+n1+","+n2+" nn="+nn0+","+nn1+","+nn2+"<br>");
            //        document.write("m="+m0+","+m1+","+m2+"<br>");
            if (n0 == 2) return !(n1 | nn1 | n2 | nn2) && this.isMentsu(m1) && this.isMentsu(m2) && this.isAtamaMentsu(nn0, m0); // 萬子が頭
            if (n1 == 2) return !(n2 | nn2 | n0 | nn0) && this.isMentsu(m2) && this.isMentsu(m0) && this.isAtamaMentsu(nn1, m1); // 筒子が頭
            if (n2 == 2) return !(n0 | nn0 | n1 | nn1) && this.isMentsu(m0) && this.isMentsu(m1) && this.isAtamaMentsu(nn2, m2); // 索子が頭
            return false;
        }
    }

    function isAgari(c, n) {
        if (n != 34) return;
        return AGARI.isAgari(c, n);
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////
    // TENHOU.NET (C)C-EGG http://tenhou.net/
    /////////////////////////////////////////////////////////////////////////////////////////////////////
    // REFERENCE
    /////////////////////////////////////////////////////////////////////////////////////////////////////
    // http://www.asamiryo.jp/fst13.html
    /////////////////////////////////////////////////////////////////////////////////////////////////////


    //function SYANTEN(a,n){}
    //SYANTEN.prototype={
    var SYANTEN = { // singleton
        n_eval: 0,
        // input
        c: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        // status
        n_mentsu: 0,
        n_tatsu: 0,
        n_toitsu: 0,
        n_jidahai: 0, // １３枚にしてから少なくとも打牌しなければならない字牌の数 -> これより向聴数は下がらない
        f_n4: 0, // 27bitを数牌、1bitを字牌で使用
        f_koritsu: 0, // 孤立牌
        // final result
        min_syanten: 8,

        updateResult: function() {
            var e = this;
            var ret_syanten = 8 - e.n_mentsu * 2 - e.n_tatsu - e.n_toitsu;
            var n_mentsu_kouho = e.n_mentsu + e.n_tatsu;
            if (e.n_toitsu) {
                n_mentsu_kouho += e.n_toitsu - 1;
            } else if (e.f_n4 && e.f_koritsu) {
                if ((e.f_n4 | e.f_koritsu) == e.f_n4) ++ret_syanten; // 対子を作成できる孤立牌が無い
            }
            if (n_mentsu_kouho > 4) ret_syanten += (n_mentsu_kouho - 4);
            if (ret_syanten != -1 && ret_syanten < e.n_jidahai) ret_syanten = e.n_jidahai;
            if (ret_syanten < e.min_syanten) e.min_syanten = ret_syanten;
        },


        // method
        init: function(a, n) {
            var e = this;
            e.c = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            // status
            e.n_mentsu = 0;
            e.n_tatsu = 0;
            e.n_toitsu = 0;
            e.n_jidahai = 0;
            e.f_n4 = 0;
            e.f_koritsu = 0;
            // final result
            e.min_syanten = 8;

            var c = this.c;
            if (n == 136) {
                for (n = 0; n < 136; ++n)
                    if (a[n]) ++c[n >> 2];
            } else if (n == 34) {
                for (n = 0; n < 34; ++n) c[n] = a[n];
            } else {
                for (n -= 1; n >= 0; --n) ++c[a[n] >> 2];
            }
        },
        count34: function() {
            var c = this.c;
            return c[0] + c[1] + c[2] + c[3] + c[4] + c[5] + c[6] + c[7] + c[8] +
                c[9] + c[10] + c[11] + c[12] + c[13] + c[14] + c[15] + c[16] + c[17] +
                c[18] + c[19] + c[20] + c[21] + c[22] + c[23] + c[24] + c[25] + c[26] +
                c[27] + c[28] + c[29] + c[30] + c[31] + c[32] + c[33];
        },

        i_anko: function(k) {
            this.c[k] -= 3, ++this.n_mentsu;
        },
        d_anko: function(k) {
            this.c[k] += 3, --this.n_mentsu;
        },
        i_toitsu: function(k) {
            this.c[k] -= 2, ++this.n_toitsu;
        },
        d_toitsu: function(k) {
            this.c[k] += 2, --this.n_toitsu;
        },
        i_syuntsu: function(k) {
            --this.c[k], --this.c[k + 1], --this.c[k + 2], ++this.n_mentsu;
        },
        d_syuntsu: function(k) {
            ++this.c[k], ++this.c[k + 1], ++this.c[k + 2], --this.n_mentsu;
        },
        i_tatsu_r: function(k) {
            --this.c[k], --this.c[k + 1], ++this.n_tatsu;
        },
        d_tatsu_r: function(k) {
            ++this.c[k], ++this.c[k + 1], --this.n_tatsu;
        },
        i_tatsu_k: function(k) {
            --this.c[k], --this.c[k + 2], ++this.n_tatsu;
        },
        d_tatsu_k: function(k) {
            ++this.c[k], ++this.c[k + 2], --this.n_tatsu;
        },
        i_koritsu: function(k) {
            --this.c[k], this.f_koritsu |= (1 << k);
        },
        d_koritsu: function(k) {
            ++this.c[k], this.f_koritsu &= ~(1 << k);
        },

        scanChiitoiKokushi: function() {
            var e = this;
            var syanten = e.min_syanten;
            var c = e.c;
            var n13 = // 幺九牌の対子候補の数
                (c[0] >= 2) + (c[8] >= 2) +
                (c[9] >= 2) + (c[17] >= 2) +
                (c[18] >= 2) + (c[26] >= 2) +
                (c[27] >= 2) + (c[28] >= 2) + (c[29] >= 2) + (c[30] >= 2) + (c[31] >= 2) + (c[32] >= 2) + (c[33] >= 2);
            var m13 = // 幺九牌の種類数
                (c[0] != 0) + (c[8] != 0) +
                (c[9] != 0) + (c[17] != 0) +
                (c[18] != 0) + (c[26] != 0) +
                (c[27] != 0) + (c[28] != 0) + (c[29] != 0) + (c[30] != 0) + (c[31] != 0) + (c[32] != 0) + (c[33] != 0);
            var n7 = n13 + // 対子候補の数
                (c[1] >= 2) + (c[2] >= 2) + (c[3] >= 2) + (c[4] >= 2) + (c[5] >= 2) + (c[6] >= 2) + (c[7] >= 2) +
                (c[10] >= 2) + (c[11] >= 2) + (c[12] >= 2) + (c[13] >= 2) + (c[14] >= 2) + (c[15] >= 2) + (c[16] >= 2) +
                (c[19] >= 2) + (c[20] >= 2) + (c[21] >= 2) + (c[22] >= 2) + (c[23] >= 2) + (c[24] >= 2) + (c[25] >= 2);
            var m7 = m13 + // 牌の種類数
                (c[1] != 0) + (c[2] != 0) + (c[3] != 0) + (c[4] != 0) + (c[5] != 0) + (c[6] != 0) + (c[7] != 0) +
                (c[10] != 0) + (c[11] != 0) + (c[12] != 0) + (c[13] != 0) + (c[14] != 0) + (c[15] != 0) + (c[16] != 0) +
                (c[19] != 0) + (c[20] != 0) + (c[21] != 0) + (c[22] != 0) + (c[23] != 0) + (c[24] != 0) + (c[25] != 0); { // 七対子
                var ret_syanten = 6 - n7 + (m7 < 7 ? 7 - m7 : 0);
                if (ret_syanten < syanten) syanten = ret_syanten;
            } { // 国士無双
                var ret_syanten = 13 - m13 - (n13 ? 1 : 0);
                if (ret_syanten < syanten) syanten = ret_syanten;
            }
            return syanten;
        },
        removeJihai: function(nc) { // 字牌
            var e = this;
            var c = e.c;
            var j_n4 = 0; // 7bitを字牌で使用
            var j_koritsu = 0; // 孤立牌
            var i;
            for (i = 27; i < 34; ++i) switch (c[i]) {
                case 4:
                    ++e.n_mentsu, j_n4 |= (1 << (i - 27)), j_koritsu |= (1 << (i - 27)), ++e.n_jidahai;
                    break;
                case 3:
                    ++e.n_mentsu;
                    break;
                case 2:
                    ++e.n_toitsu;
                    break;
                case 1:
                    j_koritsu |= (1 << (i - 27));
                    break;
            }
            if (e.n_jidahai && (nc % 3) == 2) --e.n_jidahai;

            if (j_koritsu) { // 孤立牌が存在する
                e.f_koritsu |= (1 << 27);
                if ((j_n4 | j_koritsu) == j_n4) e.f_n4 |= (1 << 27); // 対子を作成できる孤立牌が無い
            }
        },
        removeJihaiSanma19: function(nc) { // 字牌
            var e = this;
            var c = e.c;
            var j_n4 = 0; // 7+9bitを字牌で使用
            var j_koritsu = 0; // 孤立牌
            var i;
            for (i = 27; i < 34; ++i) switch (c[i]) {
                case 4:
                    ++e.n_mentsu, j_n4 |= (1 << (i - 18)), j_koritsu |= (1 << (i - 18)), ++e.n_jidahai;
                    break;
                case 3:
                    ++e.n_mentsu;
                    break;
                case 2:
                    ++e.n_toitsu;
                    break;
                case 1:
                    j_koritsu |= (1 << (i - 18));
                    break;
            }
            for (i = 0; i < 9; i += 8) switch (c[i]) {
                case 4:
                    ++e.n_mentsu, j_n4 |= (1 << i), j_koritsu |= (1 << i), ++e.n_jidahai;
                    break;
                case 3:
                    ++e.n_mentsu;
                    break;
                case 2:
                    ++e.n_toitsu;
                    break;
                case 1:
                    j_koritsu |= (1 << i);
                    break;
            }
            if (e.n_jidahai && (nc % 3) == 2) --e.n_jidahai;

            if (j_koritsu) { // 孤立牌が存在する
                e.f_koritsu |= (1 << 27);
                if ((j_n4 | j_koritsu) == j_n4) e.f_n4 |= (1 << 27); // 対子を作成できる孤立牌が無い
            }
        },
        scanNormal: function(init_mentsu) {
            var e = this;
            var c = e.c;
            e.f_n4 |= // 孤立しても対子(雀頭)になれない数牌
                ((c[0] == 4) << 0) | ((c[1] == 4) << 1) | ((c[2] == 4) << 2) | ((c[3] == 4) << 3) | ((c[4] == 4) << 4) | ((c[5] == 4) << 5) | ((c[6] == 4) << 6) | ((c[7] == 4) << 7) | ((c[8] == 4) << 8) |
                ((c[9] == 4) << 9) | ((c[10] == 4) << 10) | ((c[11] == 4) << 11) | ((c[12] == 4) << 12) | ((c[13] == 4) << 13) | ((c[14] == 4) << 14) | ((c[15] == 4) << 15) | ((c[16] == 4) << 16) | ((c[17] == 4) << 17) |
                ((c[18] == 4) << 18) | ((c[19] == 4) << 19) | ((c[20] == 4) << 20) | ((c[21] == 4) << 21) | ((c[22] == 4) << 22) | ((c[23] == 4) << 23) | ((c[24] == 4) << 24) | ((c[25] == 4) << 25) | ((c[26] == 4) << 26);
            this.n_mentsu += init_mentsu;
            e.Run(0);
        },

        Run: function(depth) { // ネストは高々１４回
            var e = this;
            ++e.n_eval;
            if (e.min_syanten == -1) return; // 和了は１つ見つければよい
            var c = e.c;
            for (; depth < 27 && !c[depth]; ++depth); // skip
            if (depth == 27) return e.updateResult();

            var i = depth;
            if (i > 8) i -= 9;
            if (i > 8) i -= 9; // mod_9_in_27
            switch (c[depth]) {
                case 4:
                    // 暗刻＋順子|搭子|孤立
                    e.i_anko(depth);
                    if (i < 7 && c[depth + 2]) {
                        if (c[depth + 1]) e.i_syuntsu(depth), e.Run(depth + 1), e.d_syuntsu(depth); // 順子
                        e.i_tatsu_k(depth), e.Run(depth + 1), e.d_tatsu_k(depth); // 嵌張搭子
                    }
                    if (i < 8 && c[depth + 1]) e.i_tatsu_r(depth), e.Run(depth + 1), e.d_tatsu_r(depth); // 両面搭子
                    e.i_koritsu(depth), e.Run(depth + 1), e.d_koritsu(depth); // 孤立
                    e.d_anko(depth);
                    // 対子＋順子系 // 孤立が出てるか？ // 対子＋対子は不可
                    e.i_toitsu(depth);
                    if (i < 7 && c[depth + 2]) {
                        if (c[depth + 1]) e.i_syuntsu(depth), e.Run(depth), e.d_syuntsu(depth); // 順子＋他
                        e.i_tatsu_k(depth), e.Run(depth + 1), e.d_tatsu_k(depth); // 搭子は２つ以上取る必要は無い -> 対子２つでも同じ
                    }
                    if (i < 8 && c[depth + 1]) e.i_tatsu_r(depth), e.Run(depth + 1), e.d_tatsu_r(depth);
                    e.d_toitsu(depth);
                    break;
                case 3:
                    // 暗刻のみ
                    e.i_anko(depth), e.Run(depth + 1), e.d_anko(depth);
                    // 対子＋順子|搭子
                    e.i_toitsu(depth);
                    if (i < 7 && c[depth + 1] && c[depth + 2]) {
                        e.i_syuntsu(depth), e.Run(depth + 1), e.d_syuntsu(depth); // 順子
                    } else { // 順子が取れれば搭子はその上でよい
                        if (i < 7 && c[depth + 2]) e.i_tatsu_k(depth), e.Run(depth + 1), e.d_tatsu_k(depth); // 嵌張搭子は２つ以上取る必要は無い -> 対子２つでも同じ
                        if (i < 8 && c[depth + 1]) e.i_tatsu_r(depth), e.Run(depth + 1), e.d_tatsu_r(depth); // 両面搭子
                    }
                    e.d_toitsu(depth);
                    // 順子系
                    if (i < 7 && c[depth + 2] >= 2 && c[depth + 1] >= 2) e.i_syuntsu(depth), e.i_syuntsu(depth), e.Run(depth), e.d_syuntsu(depth), e.d_syuntsu(depth); // 順子＋他
                    break;
                case 2:
                    // 対子のみ
                    e.i_toitsu(depth), e.Run(depth + 1), e.d_toitsu(depth);
                    // 順子系
                    if (i < 7 && c[depth + 2] && c[depth + 1]) e.i_syuntsu(depth), e.Run(depth), e.d_syuntsu(depth); // 順子＋他
                    break;
                case 1:
                    // 孤立牌は２つ以上取る必要は無い -> 対子のほうが向聴数は下がる -> ３枚 -> 対子＋孤立は対子から取る
                    // 孤立牌は合計８枚以上取る必要は無い
                    if (i < 6 && c[depth + 1] == 1 && c[depth + 2] && c[depth + 3] != 4) { // 延べ単
                        e.i_syuntsu(depth), e.Run(depth + 2), e.d_syuntsu(depth); // 順子＋他
                    } else {
                        //                if (n_koritsu<8) e.i_koritsu(depth), e.Run(depth+1), e.d_koritsu(depth);
                        e.i_koritsu(depth), e.Run(depth + 1), e.d_koritsu(depth);
                        // 順子系
                        if (i < 7 && c[depth + 2]) {
                            if (c[depth + 1]) e.i_syuntsu(depth), e.Run(depth + 1), e.d_syuntsu(depth); // 順子＋他
                            e.i_tatsu_k(depth), e.Run(depth + 1), e.d_tatsu_k(depth); // 搭子は２つ以上取る必要は無い -> 対子２つでも同じ
                        }
                        if (i < 8 && c[depth + 1]) e.i_tatsu_r(depth), e.Run(depth + 1), e.d_tatsu_r(depth);
                    }
                    break;
            }
        },
        calcSyanten(a, n, bSkipChiitoiKokushi) {
            //    var e=new SYANTEN(a,n);
            var e = SYANTEN;
            e.init(a, n);
            var nc = e.count34();
            if (nc > 14) return -2; // ネスト検査が爆発する
            if (!bSkipChiitoiKokushi && nc >= 13) e.min_syanten = e.scanChiitoiKokushi(nc); // １３枚より下の手牌は評価できない
            e.removeJihai(nc);
            //    e.removeJihaiSanma19(nc);
            var init_mentsu = Math.floor((14 - nc) / 3); // 副露面子を逆算
            e.scanNormal(init_mentsu);
            return e.min_syanten;
        },
        calcSyanten2(a, n) {
            //    var e=new SYANTEN(a,n);
            var e = SYANTEN;
            e.init(a, n);
            var nc = e.count34();
            if (nc > 14) return undefined; // ネスト検査が爆発する
            var syanten = [e.min_syanten, e.min_syanten];
            if (nc >= 13) syanten[0] = e.scanChiitoiKokushi(nc); // １３枚より下の手牌は評価できない
            e.removeJihai(nc);
            //    e.removeJihaiSanma19(nc);
            var init_mentsu = Math.floor((14 - nc) / 3); // 副露面子を逆算
            e.scanNormal(init_mentsu);
            syanten[1] = e.min_syanten;
            if (syanten[1] < syanten[0]) syanten[0] = syanten[1];
            return syanten;
        }

    };
    let tenhou = {
        MPSZ,
        SYANTEN,
        AGARI
    };
    window.Helper = class Helper {
        constructor() {
            this.reset();
            // this.autoConfirm();
            this.inject();
            this.resetDefenseInfo();
            // this.injectUI();
        }
        reset() {
            this.auto = false;
            this.seat = 0;
            this.mountain = new Array(34).fill(4);
        }
        resetDefenseInfo() {
            this.defenseInfo = { mySeat: 0, river: [[], [], [], []], riichiPlayers: [], fuuro: [[], [], [], []], chang: 0, ju: 0 };
        }
        autoConfirm() {
            if (uiscript.UI_ScoreChange.Inst) {
                if (uiscript.UI_ScoreChange.Inst.btn_confirm.visible) {
                    uiscript.UI_ScoreChange.Inst.btn_confirm.visible = false;
                    uiscript.UI_ScoreChange.Inst.onBtnConfirm();
                }
            } else {
                setTimeout(() => {
                    this.autoConfirm();
                }, 500);
            }
        }
        inject() {
            if (typeof view !== "undefined" && view.DesktopMgr.Inst) {
                console.log("已进入游戏。");
                const actionsToInject = {
                    ActionAnGangAddGang: 900,
                    ActionBabei: 900,
                    ActionChiPengGang: 900,
                    ActionDealTile: 300,
                    ActionDiscardTile: 500,
                    ActionNewRound: 1900
                }; // as { [key: string]: number } // inject with proper timeout
                for (const key in actionsToInject) {
                    const action = view[key];
                    const delay = actionsToInject[key];
                    const mToInject = ["play", "fastplay", "record", "fastrecord"];
                    mToInject.forEach(mType => {
                        const m = action[mType].bind(action);
                        action[mType] = action => {
                            const r = m(action);
                            setTimeout(() => this.analyse(key, action, mType), delay + (key === "ActionNewRound" && action.al ? 1300 : 0));
                            return r;
                        }
                    })
                }
                const m = view.DesktopMgr.Inst.setChoosedPai.bind(view.DesktopMgr.Inst);
                view.DesktopMgr.Inst.setChoosedPai = (e) => {
                    const r = m(e);
                    if (e !== null) this.warningDiscards(e);
                    return r;
                }
                //uiscript.UI_GameEnd.prototype.show = () => {
                //    if (Helper.auto) {
                //        game.Scene_MJ.Inst.GameEnd();
                //        uiscript.UI_PiPeiYuYue.Inst.addMatch(3);
                //    }
                //}
            } else {
                setTimeout(() => {
                    console.log("等待进入游戏……");
                    this.inject();
                }, 1000);
            }
        }
        warningDiscards(spai) {
            for (var i = 1; i <= 3; i++) {
                var player = view.DesktopMgr.Inst.players[i];
                for (const pair of player.container_qipai.pais) {
                    pair.model.meshRender.sharedMaterial.setColor(caps.Cartoon.COLOR, this.warningColor(spai, pair));
                }
                for (const pair of player.container_ming.pais) {
                    pair.model.meshRender.sharedMaterial.setColor(caps.Cartoon.COLOR, this.warningColor(spai, pair));
                }
                const lastpai = player.container_qipai.last_pai;
                if (lastpai !== null) {
                    lastpai.model.meshRender.sharedMaterial.setColor(caps.Cartoon.COLOR, this.warningColor(spai, lastpai));
                }
            }
            var self = view.DesktopMgr.Inst.players[0];
            for (const pair of self.container_qipai.pais) {
                pair.model.meshRender.sharedMaterial.setColor(caps.Cartoon.COLOR, this.warningColorSelf(spai, pair));
            }
            for (const pair of self.container_ming.pais) {
                pair.model.meshRender.sharedMaterial.setColor(caps.Cartoon.COLOR, this.warningColorSelf(spai, pair));
            }
            const lastpai = self.container_qipai.last_pai;
            if (lastpai !== null) {
                lastpai.model.meshRender.sharedMaterial.setColor(caps.Cartoon.COLOR, this.warningColorSelf(spai, lastpai));
            }
            //const handIn = view.DesktopMgr.Inst.mainrole.hand;
            // for (const tile of handIn) {
            //   tile._SetColor(this.waringColorSelf(spai, tile.val));
            //}
        }
        warningColor(a, bmodel) {
            var b = bmodel.val;
            var defaultColor = bmodel.ismoqie ? new Laya.Vector4(0.8, 0.8, 0.8, 1) : new Laya.Vector4(1, 1, 1, 1);
            if (a.type !== b.type) return defaultColor;
            var c = Math.abs(a.index - b.index);
            if (c == 0) return new Laya.Vector4(0.5, 0.5, 1, 1);
            if (a.type != 3) {
                if (c == 3) {
                    if (a.index <= 6 && a.index >= 4) return new Laya.Vector4(1, 0.8, 0.8, 1);
                    return new Laya.Vector4(1, 0.5, 0.5, 1);
                }
                if (a.index <= 6 && a.index >= 4) { // 对于456，成壁的可能性很低。距离为1的最有效，为2的效果较差
                    if (c == 1) return new Laya.Vector4(1, 1, 0.6, 1);
                    if (c == 2) return new Laya.Vector4(1, 1, 0.8, 1);
                } else if (a.index == 7 || a.index == 3) {
                    if (a.index == 7) { // 对于7，5和6成的壁最有用，8和9效果差
                        if (b.index == 6) return new Laya.Vector4(1, 1, 0.2, 1);
                        if (b.index == 5) return new Laya.Vector4(1, 1, 0.4, 1);
                        if (b.index == 8) return new Laya.Vector4(1, 1, 0.6, 1);
                        if (b.index == 9) return new Laya.Vector4(1, 1, 0.8, 1);
                    } else { // 对于3，5和4成的壁最有用，2和1效果差
                        if (b.index == 4) return new Laya.Vector4(1, 1, 0.2, 1);
                        if (b.index == 5) return new Laya.Vector4(1, 1, 0.4, 1);
                        if (b.index == 2) return new Laya.Vector4(1, 1, 0.6, 1);
                        if (b.index == 1) return new Laya.Vector4(1, 1, 0.8, 1);
                    }
                } else if (a.index > 7) {
                    if (a.index == 8) { // 对于8，6和7成的壁最有用，9效果差
                        if (b.index == 7) return new Laya.Vector4(1, 1, 0, 1);
                        if (b.index == 6) return new Laya.Vector4(1, 1, 0.2, 1);
                        if (b.index == 9) return new Laya.Vector4(1, 1, 0.6, 1);
                    } else if (c == 1 || c == 2) return new Laya.Vector4(1, 1, 0, 1); // 对于9，7和8的效果等同。
                } else {
                    if (a.index == 2) { // 对于2，3和4成的壁最有用，1效果差
                        if (b.index == 3) return new Laya.Vector4(1, 1, 0, 1);
                        if (b.index == 4) return new Laya.Vector4(1, 1, 0.2, 1);
                        if (b.index == 1) return new Laya.Vector4(1, 1, 0.6, 1);
                    } else if (c == 1 || c == 2) return new Laya.Vector4(1, 1, 0, 1); // 对于1，2和3的效果等同。
                }
            }
            return defaultColor;
        }
        warningColorSelf(a, bmodel) { // 自己只考虑壁候选牌以及现物
            var b = bmodel.val;
            var defaultColor = bmodel.ismoqie ? new Laya.Vector4(0.8, 0.8, 0.8, 1) : new Laya.Vector4(1, 1, 1, 1);
            if (a.type !== b.type) return defaultColor;
            var c = Math.abs(a.index - b.index);
            if (c == 0) return new Laya.Vector4(0.5, 0.5, 1, 1);
            if (a.type != 3) {
                if (c == 3) {
                    if (a.index <= 6 && a.index >= 4) return new Laya.Vector4(1, 0.8, 0.8, 1);
                    return new Laya.Vector4(1, 0.5, 0.5, 1);
                }
                if (a.index <= 6 && a.index >= 4) { // 对于456，成壁的可能性很低。距离为1的最有效，为2的效果较差
                    if (c == 1) return new Laya.Vector4(1, 1, 0.6, 1);
                    if (c == 2) return new Laya.Vector4(1, 1, 0.8, 1);
                } else if (a.index == 7 || a.index == 3) {
                    if (a.index == 7) { // 对于7，5和6成的壁最有用，8和9效果差
                        if (b.index == 6) return new Laya.Vector4(1, 1, 0.2, 1);
                        if (b.index == 5) return new Laya.Vector4(1, 1, 0.4, 1);
                        if (b.index == 8) return new Laya.Vector4(1, 1, 0.6, 1);
                        if (b.index == 9) return new Laya.Vector4(1, 1, 0.8, 1);
                    } else { // 对于3，5和4成的壁最有用，2和1效果差
                        if (b.index == 4) return new Laya.Vector4(1, 1, 0.2, 1);
                        if (b.index == 5) return new Laya.Vector4(1, 1, 0.4, 1);
                        if (b.index == 2) return new Laya.Vector4(1, 1, 0.6, 1);
                        if (b.index == 1) return new Laya.Vector4(1, 1, 0.8, 1);
                    }
                } else if (a.index > 7) {
                    if (a.index == 8) { // 对于8，6和7成的壁最有用，9效果差
                        if (b.index == 7) return new Laya.Vector4(1, 1, 0, 1);
                        if (b.index == 6) return new Laya.Vector4(1, 1, 0.2, 1);
                        if (b.index == 9) return new Laya.Vector4(1, 1, 0.6, 1);
                    } else if (c == 1 || c == 2) return new Laya.Vector4(1, 1, 0, 1); // 对于9，7和8的效果等同。
                } else {
                    if (a.index == 2) { // 对于2，3和4成的壁最有用，1效果差
                        if (b.index == 3) return new Laya.Vector4(1, 1, 0, 1);
                        if (b.index == 4) return new Laya.Vector4(1, 1, 0.2, 1);
                        if (b.index == 1) return new Laya.Vector4(1, 1, 0.6, 1);
                    } else if (c == 1 || c == 2) return new Laya.Vector4(1, 1, 0, 1); // 对于1，2和3的效果等同。
                }
            }
            return defaultColor;
        }
        injectUI() {
            if (typeof uiscript === "undefined" || !uiscript.UI_DesktopInfo || typeof ui === "undefined" || !ui.mj.desktopInfoUI.uiView) return setTimeout(this.injectUI, 1000);
            console.log("Majsoul UIScript injected.")
            let e = uiscript;
            let o = uiscript.UI_DesktopInfo;
            uiscript.UI_DesktopInfo.prototype.refreshSeat = function(e) {
                void 0 === e && (e = !1);
                view.DesktopMgr.Inst.seat;
                for (var t = view.DesktopMgr.Inst.player_datas, i = 0; i < 4; i++) {
                    var n = view.DesktopMgr.Inst.localPosition2Seat(i),
                        a = this._player_infos[i];
                    if (n < 0) a.container.visible = !1;
                    else {
                        if (a.container.visible = !0,
                            a.name.text = t[n].nickname,
                            a.head.id = t[n].avatar_id,
                            a.avatar = t[n].avatar_id,
                            a.head.setEmo(""),
                            a.level = new uiscript.UI_Level(this.me.getChildByName("container_player_" + i).getChildByName("head").getChildByName("level")),
                            a.level.id = t[n].level.id,
                            0 != i) {
                            var r = t[n].account_id && 0 != t[n].account_id && view.DesktopMgr.Inst.mode != view.EMJMode.paipu,
                                o = t[n].account_id && 0 != t[n].account_id && view.DesktopMgr.Inst.mode == view.EMJMode.play,
                                s = view.DesktopMgr.Inst.mode != view.EMJMode.play;
                            e ? a.headbtn.onChangeSeat(r, o, s) : a.headbtn.reset(r, o, s)
                        }
                        t[n].title ? a.title.id = t[n].title : a.title.id = 0
                    }
                }
            }
            for (let i = 5; i <= 8; i++) {
                ui.mj.desktopInfoUI.uiView.child[i].child[3].child[1] = {
                    type: "Image",
                    props: {
                        y: -10,
                        x: -10,
                        name: "level",
                        scaleY: .5,
                        scaleX: .5
                    },
                    child: [{
                        type: "Image",
                        props: {
                            y: 0,
                            x: 0,
                            skin: "myres/rank_bg.png",
                            name: "bg"
                        }
                    }, {
                        type: "Image",
                        props: {
                            y: 15,
                            x: 0,
                            skin: "extendRes/level/queshi.png",
                            name: "icon"
                        }
                    }, {
                        type: "Image",
                        props: {
                            y: 191,
                            x: 58,
                            skin: "myres/starbg.png",
                            scaleY: 1,
                            scaleX: 1,
                            name: "star2",
                            anchorY: .5,
                            anchorX: .5
                        },
                        child: [{
                            type: "Image",
                            props: {
                                y: 26,
                                x: 27,
                                skin: "myres/star.png",
                                anchorY: .5,
                                anchorX: .5
                            }
                        }]
                    }, {
                        type: "Image",
                        props: {
                            y: 142,
                            x: 29,
                            skin: "myres/starbg.png",
                            scaleY: .7,
                            scaleX: .7,
                            name: "star3",
                            anchorY: .5,
                            anchorX: .5
                        },
                        child: [{
                            type: "Image",
                            props: {
                                y: 26,
                                x: 27,
                                skin: "myres/star.png",
                                anchorY: .5,
                                anchorX: .5
                            }
                        }]
                    }, {
                        type: "Image",
                        props: {
                            y: 214,
                            x: 110,
                            skin: "myres/starbg.png",
                            scaleY: .7,
                            scaleX: .7,
                            name: "star1",
                            anchorY: .5,
                            anchorX: .5
                        },
                        child: [{
                            type: "Image",
                            props: {
                                y: 26,
                                x: 27,
                                skin: "myres/star.png",
                                anchorY: .5,
                                anchorX: .5
                            }
                        }]
                    }]
                }

            }
            return true;
        }
        handToString() {
            const handIn = view.DesktopMgr.Inst.mainrole.hand;
            let strOut = "";
            for (const tileInGameIn of handIn) {
                strOut += tileInGameIn.val.toString();
            }
            return tenhou.MPSZ.contract(strOut);
        }
        analyse(key, action, mType) {
            this.calcMountain();
            if (mType !== "play") return;
            if (key == "ActionNewRound") {
                view.DesktopMgr.Inst.setAutoHule(true);
                uiscript.UIMgr.Inst._ui_desktop.refreshFuncBtnShow(uiscript.UIMgr.Inst._ui_desktop._container_fun.getChildByName("btn_autohu"), 1);
                if (this.auto) {
                    view.DesktopMgr.Inst.setAutoNoFulu(true);
                    uiscript.UIMgr.Inst._ui_desktop.refreshFuncBtnShow(uiscript.UIMgr.Inst._ui_desktop._container_fun.getChildByName("btn_autonoming"), 1);
                }
                this.resetDefenseInfo();
            }
            if (key == "ActionDiscardTile") {
                let tile = null;
                for (let i = 0; i < 4; i++) {
                    if (view.DesktopMgr.Inst.players[i].seat == action.seat) {
                        tile = view.DesktopMgr.Inst.lastqipai;
                    }
                }
                this.defenseInfo.river[action.seat].push({ tileIndex: Helper.indexOfTile(tile.val.toString()), afterRiichi: this.defenseInfo.riichiPlayers.slice() });
                if (action.is_liqi || action.is_wliqi) this.defenseInfo.riichiPlayers.push(action.seat);
                if (action.moqie) {
                    tile.ismoqie = true;
                    tile.model.meshRender.sharedMaterial.setColor(caps.Cartoon.COLOR, new Laya.Vector4(0.8, 0.8, 0.8, 1));
                }
            }
            if (action.hasOwnProperty("operation")) {
                const operations = action.operation;
                var riichiable = false;
                if (this.auto) {
                    for (const operation of operations.operation_list) {
                        if (operation.type == 11) { // Babei
                            if (this.auto) console.log("拔北！");
                            setTimeout(() => uiscript.UI_LiQiZiMo.Inst.onBtn_BaBei(), Math.random() * 500 + Math.random() * 500 + 500);
                            return;
                        }
                        if (operation.type == 10) { // 九种九牌
                            if (this.auto) console.log("九种九牌～");
                            setTimeout(() => uiscript.UI_LiQiZiMo.Inst.onBtn_Liuju(), Math.random() * 500 + Math.random() * 500 + 500);
                            return;
                        }
                        if (operation.type == 7) {
                            riichiable = true;
                        }
                        // if (operation.type == 7) {
                        //    // console.log("立直！");
                        //     setTimeout(() => uiscript.UI_LiQiZiMo.Inst.onBtn_Liqi(), 300);
                        // }
                        if (operation.type == 5) { // 立直后能杠才杠
                            if (this.auto) console.log("杠鸭！");
                            if (this.defenseInfo.riichiPlayers.indexOf(this.defenseInfo.mySeat) >= 0) {
                                setTimeout(() => uiscript.UI_LiQiZiMo.Inst.onBtn_Gang(), Math.random() * 500 + Math.random() * 500 + 500);
                            }
                        }
                    }
                }
                for (const operation of operations.operation_list) {
                    if (operation.type == 1) {
                        this.defenseInfo.mySeat = view.DesktopMgr.Inst.seat;
                        this.defenseInfo.chang = view.DesktopMgr.Inst.index_change;
                        this.defenseInfo.ju = view.DesktopMgr.Inst.index_ju;

                        const handTiles = this.handToString();
                        const optionsATK = this.analyseHandATK(handTiles);
                        const optionsDEF = this.analyseHandDEF(handTiles, this.mountain, this.defenseInfo, view.DesktopMgr.Inst.player_datas.length);

                        // console.log(JSON.stringify(optionsATK));
                        // console.log(JSON.stringify(optionsDEF));

                        optionsATK[0].sort((a, b) => b.m - a.m);
                        var maxm = optionsATK[0][0].m;
                        optionsATK[0].sort((a, b) => b.n - a.n);
                        var maxn = optionsATK[0][0].n;
                        optionsATK[1].sort((a, b) => b.n - a.n);

                        const finalColors = new Array(34).fill(0);
                        const finalAlphas = new Array(34).fill(0);

                        // console.log(JSON.stringify(optionsATK));
                        // console.log("maxm " + maxm);
                        // console.log("maxn " + maxn);

                        var bestn_in_maxm = 0;
                        for (var i = 0; i < optionsATK[0].length; i++) {
                            if ((optionsATK[0][i].m == maxm) && (optionsATK[0][i].n > bestn_in_maxm)) {
                                bestn_in_maxm = optionsATK[0][i].n;
                            }
                        }

                        for (var i = 0; i < optionsATK[0].length; i++) {
                            if ((optionsATK[0][i].m == maxm) && (optionsATK[0][i].n == bestn_in_maxm)) {
                                finalColors[optionsATK[0][i].tileIndex] = 1; // LightBlue 0.5, 0.8, 0.9
                            } else if (optionsATK[0][i].n == maxn) {
                                finalColors[optionsATK[0][i].tileIndex] = 2; // Gold 0.9, 0.7, 0.3
                            }
                        }

                        // 不透明度 = 安全度
                        // 有人立直 0.4 ~ 1
                        // 无人立直 0.7 ~ 1 只提示最危险的少数牌
                        const playersDangerRate = [];
                        const mySeat = this.defenseInfo.mySeat;
                        var riichied = 0;
                        for (let seat = 0; seat < 4; seat++) { // look if anyone riichied.
                            if (this.defenseInfo.riichiPlayers.indexOf(seat) >= 0) {
                                riichied++;
                            }
                        }

                        // console.log('是否有人立直: ' + riichied);
                        let maxDefRate = optionsDEF[0].rate;
                        let minDefRate = optionsDEF[optionsDEF.length - 1].rate;
                        let scalemax = riichied ? 1 : 1.4;
                        let scalemin = riichied ? 0.4 : 0.7;
                        let scaleN = 1;
                        let scaleK = 0;
                        if (maxDefRate != minDefRate) {
                            scaleN = (scalemax - scalemin) / (maxDefRate - minDefRate);
                            scaleK = scalemax - maxDefRate * scaleN;
                        }
                        for (var i = 0; i < optionsDEF.length; i++) {
                            finalAlphas[optionsDEF[i].tileIndex] = Math.min(optionsDEF[i].rate * scaleN + scaleK, 1);
                        }
                        // console.log('scalemax: ' + scalemax);
                        // console.log('scalemin: ' + scalemin);
                        // console.log('scaleN: ' + scaleN);
                        // console.log('scaleK: ' + scaleK);

                        // console.log(finalColors);
                        // console.log(finalAlphas);

                        view.DesktopMgr.Inst.mainrole.hand.forEach(tile => tile._SetColor(new Laya.Vector4(1, 1, 1, 1)));
                        for (var i = 0; i < 34; i++) {
                            if ((finalColors[i] > 0) || (finalAlphas[i] > 0)) {
                                var discard = tenhou.MPSZ.fromHai136(i * 4 + 1);
                                if (finalColors[i] == 1) {
                                    this.getFromHand(discard).forEach(tile => {
                                        tile._SetColor(new Laya.Vector4(0.5, 0.8, 0.9, finalAlphas[i]));
                                        // setTimeout(() => tile._SetColor(new Laya.Vector4(0.5, 0.8, 0.9, finalAlphas[i])), 750);
                                    });
                                } else if (finalColors[i] == 2) {
                                    this.getFromHand(discard).forEach(tile => {
                                        tile._SetColor(new Laya.Vector4(0.9, 0.7, 0.3, finalAlphas[i]));
                                        // setTimeout(() => tile._SetColor(new Laya.Vector4(0.9, 0.7, 0.3, finalAlphas[i])), 750);
                                    });
                                } else {
                                    this.getFromHand(discard).forEach(tile => {
                                        tile._SetColor(new Laya.Vector4(1, 1, 1, finalAlphas[i]));
                                        // setTimeout(() => tile._SetColor(new Laya.Vector4(1, 1, 1, finalAlphas[i])), 750);
                                    });
                                }
                            }
                        }

                        // 攻守判断
                        // 好牌合理进攻，烂牌坚决不铳
                        // 有人立直全弃，博敌互相直击
                        let syanten = optionsATK[0][0].s; // 向听数
                        let turns = 0; // 巡目
                        for (let i = 0; i < this.defenseInfo.river.length; i++) {
                            turns += this.defenseInfo.river[i].length;
                        }
                        turns /= view.DesktopMgr.Inst.player_datas.length;

                        let attackTile = 0;
                        let willRiichi = 0;
                        if ((syanten == 0) && (optionsATK[0][0].m < 2.01)) {
                            attackTile = optionsATK[1][0].tileIndex * 4 + 1;
                            if (this.auto) console.log("3张以下听牌，向听倒退寻求改良");
                        } else if ((syanten == 1) && (optionsATK[0][0].m < 7.01)) {
                            attackTile = optionsATK[1][0].tileIndex * 4 + 1;
                            if (this.auto) console.log("8张以下一向听，向听倒退寻求改良");
                        } else if (syanten >= 5) {
                            attackTile = optionsATK[0][optionsATK[0].length - 1].tileIndex * 4 + 1;
                            if (this.auto) console.log("5向听以上，溜了");
                        } else {
                            // 正常进攻
                            if (this.auto) console.log(optionsATK);
                            attackTile = optionsATK[0][0].tileIndex * 4 + 1;
                            if (riichiable) {
                                willRiichi = 1;
                                if (this.auto) console.log("久 等 了！");
                            }
                        }
                        let defenseTile = optionsDEF[0].tileIndex * 4 + 1; // 防守时切的牌

                        // 判断凶的情况
                        let doras = this.getDora();
                        for (let seat = 0; seat < 4; seat++) {
                            playersDangerRate[seat] = 0;
                            if (seat === mySeat) continue;
                            // 如果自己dora在3张以上，倾向进攻
                            if (optionsATK[0][0].d > 2) {
                                playersDangerRate[seat] -= 0.2 * (optionsATK[0][0].d - 2);
                            }
                            // 如果他家早巡切出了dora，倾向进攻
                            for (let i = 0; i < Math.min(this.defenseInfo.river[seat].length, 5); i++) {
                                if (doras[this.defenseInfo.river[seat][i].tileIndex] > 0) {
                                   playersDangerRate[seat] -= 0.2;
                                }
                            }
                        }
                        // 判断缩的情况
                        for (let seat = 0; seat < 4; seat++) {
                            if (seat === mySeat) continue;
                            if (this.defenseInfo.riichiPlayers.indexOf(seat) >= 0) {
                                playersDangerRate[seat] = 1; // 有玩家立直
                                continue;
                            } else {
                                playersDangerRate[seat] += Math.min((this.defenseInfo.river[seat].length - 5) / 10, 1); // 从第5巡开始考虑危险度，早巡不防
                                if (riichied > 0) {
                                    playersDangerRate[seat] /= Math.pow(1.5, riichied); // 有玩家立直时优先防守立直家
                                }
                                playersDangerRate[seat] += this.defenseInfo.fuuro[seat].length * 0.1; // 副露越多越危险
                                for (let i = 0; i < this.defenseInfo.fuuro[seat].length; i++) {
                                    if (doras[this.defenseInfo.fuuro[seat][i].tileIndex] > 0) {
                                        playersDangerRate[seat] += 0.1; // 副露的dora越多越危险
                                    }
                                }
                            }
                            playersDangerRate[seat] = Math.min(playersDangerRate[seat], 1);
                            playersDangerRate[seat] = Math.max(playersDangerRate[seat], 0);
                        }
                        if (this.auto) console.log("他家危险度: " + playersDangerRate);

                        let attack = true; // 默认进攻
                        let danger = false;
                        for (let seat = 0; seat < 4; seat++) {
                            if (playersDangerRate[seat] > 0.99) {
                                danger = true;
                            }
                        }
                        if ((danger) && (syanten > 1)) {
                            attack = false;
                            if (this.auto) console.log("一向听以上，过于危险的情况无进攻必要");
                        }
                        if ((danger) && (syanten == 1) && (optionsATK[0][0].m < turns + 2)) {
                            attack = false;
                            if (this.auto) console.log("愚型一向听，过于危险的情况无进攻必要");
                        }
                        if ((syanten >= 3) && (turns >= 6)) {
                            attack = false;
                            if (this.auto) console.log("六巡三向听无进攻必要");
                        }
                        if ((syanten >= 2) && (turns >= 12)) {
                            attack = false;
                            if (this.auto) console.log("十二巡两向听无进攻必要");
                        }
                        
                        let finalDiscardTile = attack ? attackTile : defenseTile;
                        if (this.auto) {
                            if (attack) {
                                if (willRiichi) {
                                    setTimeout(() => uiscript.UI_LiQiZiMo.Inst.onBtn_Liqi(), 300);
                                }
                            }
                            console.log('切牌: ' + tenhou.MPSZ.fromHai136(finalDiscardTile));
                            setTimeout(() => this.discard(tenhou.MPSZ.fromHai136(finalDiscardTile)), Math.random() * 500 + Math.random() * 500 + 500);
                        }
                    }
                }
            }
        }
        calcMountain() {
            this.mountain = new Array(34).fill(4);
            if (view.DesktopMgr.Inst.player_datas.length == 3) {
                for (let i = 1; i < 8; i++) {
                    this.mountain[i] = 0;
                }
            }
            const visibleTiles = [];
            view.DesktopMgr.Inst.players.forEach((player, i) => { // 别家弃牌和副露
                const seat = view.DesktopMgr.Inst.localPosition2Seat(i);
                this.defenseInfo.fuuro[seat] = [];
                const reinitRiver = player.container_qipai.pais.length && !this.defenseInfo.river[seat].length ? true : false;
                if (reinitRiver) this.defenseInfo.river[seat] = [];
                for (const tile of player.container_qipai.pais) {
                    if (!tile['8q_fulu_sign']) { // 兼容副露插件
                        visibleTiles.push(tile.val.toString());
                    }
                    if (reinitRiver) this.defenseInfo.river[seat].push({ tileIndex: Helper.indexOfTile(tile.val.toString()), afterRiichi: []});
                }
                for (const tile of player.container_babei.pais) {
                    visibleTiles.push(tile.val.toString());
                }
                const lastTile = player.container_qipai.last_pai;
                if (lastTile !== null) visibleTiles.push(lastTile.val.toString());
                for (const tile of player.container_ming.pais) {
                    visibleTiles.push(tile.val.toString());
                    this.defenseInfo.fuuro[seat].push(Helper.indexOfTile(tile.val.toString()));
                }
            })
            view.DesktopMgr.Inst.mainrole.hand.forEach(tile => { // 自家手牌
                visibleTiles.push(tile.val.toString());
            });
            view.DesktopMgr.Inst.dora.forEach(tile => { // 宝牌指示牌
                visibleTiles.push(tile.toString());
            });
            visibleTiles.forEach(strTile => this.mountain[Helper.indexOfTile(strTile)]--);
            return this.mountain;
        }
        handleDiscards(mountain) {
            mountain.fill(4);
            if (view.DesktopMgr.Inst.player_datas.length == 3) {
                mountain.fill(0, 1, 8); // 三麻去除2-8m
            }
            var dic = {};
            for (const player of view.DesktopMgr.Inst.players) {
                for (const pair of player.container_qipai.pais) {
                    if (!pair['8q_fulu_sign']) { // 兼容副露插件
                        const str = pair.val.toString();
                        if (dic[str] === undefined) dic[str] = 1;
                        else dic[str]++;
                    }
                }
                const lastpai = player.container_qipai.last_pai;
                if (lastpai !== null) {
                    const str = lastpai.val.toString();
                    if (dic[str] === undefined) dic[str] = 1;
                    else dic[str]++;
                }
                for (const pair of player.container_ming.pais) {
                    const str = pair.val.toString();
                    if (dic[str] === undefined) dic[str] = 1;
                    else dic[str]++;
                }
                for (const pair of player.container_babei.pais) {
                    const str = pair.val.toString();
                    if (dic[str] === undefined) dic[str] = 1;
                    else dic[str]++;
                }
            }
            for (const pair of view.DesktopMgr.Inst.dora) {
                const str = pair.toString();
                if (dic[str] === undefined) dic[str] = 1;
                else dic[str]++;
            }
            for (let i = 0; i < 34; ++i) {
                const vs = tenhou.MPSZ.fromHai136(i * 4 + 1);
                if (dic[vs] !== undefined) mountain[i] -= dic[vs];
            }
        }

        analyseHandATK(tilesIn) {
            const restc = (tiles, c34, mountain, doras, doraweight) => {
                let n = 0;
                for (let i = 0; i < tiles.length; ++i) {
                    let rest = mountain[tiles[i]] - c34[tiles[i]];
                    if (doras[i] > 0) {
                        rest *= Math.pow(doraweight, doras[i]);
                    }
                    n += rest;
                }
                return n;
            };
            let mt = new Array(34).fill(4);
            this.handleDiscards(mt);

            const tiles = tenhou.MPSZ.expand(tilesIn);
            const c = tenhou.MPSZ.exextract34(tiles);

            // TODO: 加权处理dora
            // 大概率鸽了
            let doras = this.getDora();
            let currentdora = 0;
            for (let i = 0; i < 34; ++i) {
                if (!c[i])
                    continue;
                currentdora += c[i] * doras[i];
            }
            currentdora += this.countSubString("0m", tiles, false);
            currentdora += this.countSubString("0p", tiles, false);
            currentdora += this.countSubString("0s", tiles, false);
            currentdora += view.DesktopMgr.Inst.players[0].container_babei.pais.length; // 拔北数量
            if (currentdora > 0) {
                currentdora--;
            }

            // 根据现有 dora 数量决定贪不贪
            const doraweightlist = [1.6, 1.4, 1.3, 1.2, 1.1, 1.05, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
            const doraweight = doraweightlist[currentdora]; // dora权重

            // console.log('原始手牌: ' + tilesIn);
            // console.log('预处理手牌: ' + tiles);
            // console.log('宝牌数量: ' + currentdora);

            let red5m = (tiles.indexOf('0m') != -1) ? true : false;
            let red5p = (tiles.indexOf('0p') != -1) ? true : false;
            let red5s = (tiles.indexOf('0s') != -1) ? true : false;
            let free5m = ((tiles.indexOf('5m') != -1) && (tiles.indexOf('0m') != -1)) ? true : false;
            let free5p = ((tiles.indexOf('5p') != -1) && (tiles.indexOf('0p') != -1)) ? true : false;
            let free5s = ((tiles.indexOf('5s') != -1) && (tiles.indexOf('0s') != -1)) ? true : false;

            // console.log('未见牌:' + JSON.stringify(mt));
            // console.log('手牌: ' + JSON.stringify(c));
            // console.log('宝牌: ' + JSON.stringify(doras));

            const syanten_org = view.DesktopMgr.Inst.auto_nofulu ? tenhou.SYANTEN.calcSyanten2(c, 34)[0] :
                tenhou.SYANTEN.calcSyanten2(c, 34)[1];
            // console.log('向听数:' + syanten_org);

            const options = new Array(34); // 正常切法
            const options_b = new Array(34); // 向听倒退切法
            const nextjzoptions = new Array(34);
            const nextgloptions = new Array(34);
            const nextgl2options = new Array(34);
            if (syanten_org == -1) {
                // console.log("和牌！");
            }
            if (syanten_org == 0) {
                const c_enum_machi34 = (c) => {
                    const r = [];
                    for (let i = 0; i < 34; ++i) {
                        if (c[i] >= 4)
                            continue;
                        if (!mt[i])
                            continue;
                        c[i]++; // 摸
                        if (tenhou.AGARI.isAgari(c))
                            r.push(i);
                        c[i]--;
                    }
                    return r;
                };
                for (let i = 0; i < 34; ++i) { // 遍历打/摸
                    if (!c[i])
                        continue;
                    if (!mt[i])
                        continue;
                    let dora_power = 1;
                    if (doras[i] > 0) {
                        dora_power /= Math.pow(doraweight, doras[i]);
                    }
                    if ((i == 4) && red5m && !free5m) {
                        dora_power /= doraweight;
                    }
                    if ((i == 13) && red5p && !free5p) {
                        dora_power /= doraweight;
                    }
                    if ((i == 22) && red5s && !free5s) {
                        dora_power /= doraweight;
                    }
                    c[i]--; // 打
                    options[i] = c_enum_machi34(c);
                    c[i]++;
                    if (options[i].length) { // 听牌
                        // console.log('打: ' + Helper.indexToString(i) + ', 听牌: ' + JSON.stringify(options[i]) + ', 张数: ' + restc(options[i], c, mt, doras, doraweight));
                        options[i] = {
                            tileIndex: i,
                            m: restc(options[i], c, mt, doras, doraweight) * dora_power,
                            n: restc(options[i], c, mt, doras, doraweight) * dora_power,
                            v: options[i],
                            s: syanten_org,
                            d: currentdora
                        };
                    } else { // 向听倒退
                        c[i]--; // 打
                        nextjzoptions[i] = [];
                        nextgloptions[i] = [];
                        for (let j = 0; j < 34; ++j) {
                            if ((view.DesktopMgr.Inst.player_datas.length == 3) && (j >= 1) && (j <= 7)) {
                                continue; // 三麻没有 2-8m
                            }
                            if (i == j || c[j] >= 4)
                                continue;
                            c[j]++; // 摸
                            let syanten_new = view.DesktopMgr.Inst.auto_nofulu ? tenhou.SYANTEN.calcSyanten2(c, 34)[0] :
                                tenhou.SYANTEN.calcSyanten2(c, 34)[1];
                            if (syanten_new == 0)
                                nextjzoptions[i].push(j);
                            if (syanten_new == 1)
                                nextgloptions[i].push(j);
                            c[j]--; // 打
                        }
                        c[i]++; // 摸
                        let daotuijz = restc(nextjzoptions[i], c, mt, doras, doraweight) * dora_power;
                        let daotuigl = restc(nextgloptions[i], c, mt, doras, doraweight) * dora_power;
                        if (nextjzoptions[i].length || nextgloptions[i].length) { 
                            // console.log('打' + Helper.indexToString(i) + '向听倒退, 重新听牌牌张: ' + JSON.stringify(nextjzoptions[i]) + ', 一向听牌张: ' + JSON.stringify(nextgloptions[i]));
                            options_b[i] = {
                                tileIndex: i,
                                m: daotuijz * dora_power,
                                n: (daotuijz + daotuigl * 0.2) * dora_power,
                                v: options[i],
                                s: syanten_org + 1,
                                d: currentdora
                            };
                        }
                    }
                }
            } else {
                for (let i = 0; i < 34; ++i) {
                    if (!c[i])
                        continue;
                    c[i]--; // 打

                    let dora_power = 1;
                    if (doras[i] > 0) {
                        dora_power /= Math.pow(doraweight, doras[i]);
                    }
                    if ((i == 4) && red5m && !free5m) {
                        dora_power /= doraweight;
                    }
                    if ((i == 13) && red5p && !free5p) {
                        dora_power /= doraweight;
                    }
                    if ((i == 22) && red5s && !free5s) {
                        dora_power /= doraweight;
                    }

                    options[i] = [];
                    let currentjz = 0; // 进张数
                    let nextjz = 0; // 次轮进张数
                    let nextgl = 0; // 次轮改良数
                    let nextgl2 = 0; // 次轮再改良数

                    for (let j = 0; j < 34; ++j) {
                        if ((view.DesktopMgr.Inst.player_datas.length == 3) && (j >= 1) && (j <= 7)) {
                            continue; // 三麻没有 2-8m
                        }
                        if (i == j || c[j] >= 4)
                            continue;
                        c[j]++; // 摸
                        let syanten_new = view.DesktopMgr.Inst.auto_nofulu ? tenhou.SYANTEN.calcSyanten2(c, 34)[0] :
                            tenhou.SYANTEN.calcSyanten2(c, 34)[1];
                        if (syanten_new == syanten_org - 1)
                            options[i].push(j);
                        c[j]--; // 打
                    }
                    currentjz = restc(options[i], c, mt, doras, doraweight) * dora_power;

                    options[i] = [];
                    options_b[i] = [];
                    for (let j = 0; j < 34; ++j) {
                        if ((view.DesktopMgr.Inst.player_datas.length == 3) && (j >= 1) && (j <= 7)) {
                            continue; // 三麻没有 2-8m
                        }
                        if (i == j || c[j] >= 4)
                            continue;
                        if (!mt[j])
                            continue;
                        c[j]++; // 摸
                        mt[j]--;
                        let syanten_new = view.DesktopMgr.Inst.auto_nofulu ? tenhou.SYANTEN.calcSyanten2(c, 34)[0] :
                            tenhou.SYANTEN.calcSyanten2(c, 34)[1];
                        if (syanten_new == syanten_org - 1) { // 进张
                            options[i].push(j);
                            for (let k = 0; k < 34; ++k) {
                                if (!c[k])
                                    continue;
                                if (doras[k] > 0) {
                                    dora_power /= Math.pow(doraweight, doras[k]);
                                }
                                c[k]--; // 打
                                nextjzoptions[k] = [];
                                for (let l = 0; l < 34; ++l) {
                                    if ((view.DesktopMgr.Inst.player_datas.length == 3) && (l >= 1) && (l <= 7)) {
                                        continue; // 三麻没有 2-8m
                                    }
                                    if (k == l || c[l] >= 4)
                                        continue;
                                    if (!mt[l])
                                        continue;
                                    c[l]++; // 摸
                                    let syanten_new_next = view.DesktopMgr.Inst.auto_nofulu ? tenhou.SYANTEN.calcSyanten2(c, 34)[0] :
                                        tenhou.SYANTEN.calcSyanten2(c, 34)[1];
                                    if (syanten_new_next == syanten_org - 2) {
                                        nextjzoptions[k].push(l);
                                    }
                                    c[l]--;
                                }
                                c[k]++;
                                // console.log("试打: " + i + ", 进张数: " + restc(nextjzoptions[k], c, mt, doras, doraweight) + ", 进张: " + JSON.stringify(nextgloptions[k]));
                                nextjz += restc(nextjzoptions[k], c, mt, doras, doraweight) * mt[j] * dora_power;
                                if (doras[k] > 0) {
                                    dora_power *= Math.pow(doraweight, doras[k]);
                                }
                            }
                        } else if (syanten_new == syanten_org) { // 改良
                            options_b[i].push(j);
                            for (let k = 0; k < 34; ++k) {
                                if (!c[k])
                                    continue;
                                if (doras[k] > 0) {
                                    dora_power /= Math.pow(doraweight, doras[k]);
                                }
                                c[k]--; // 打
                                nextgloptions[k] = [];
                                nextgl2options[k] = [];
                                for (let l = 0; l < 34; ++l) {
                                    if (k == l || c[l] >= 4)
                                        continue;
                                    if (!mt[l])
                                        continue;
                                    c[l]++; // 摸
                                    let syanten_new_next = view.DesktopMgr.Inst.auto_nofulu ? tenhou.SYANTEN.calcSyanten2(c, 34)[0] :
                                        tenhou.SYANTEN.calcSyanten2(c, 34)[1];
                                    if (syanten_new_next == syanten_org - 1) {
                                        nextgloptions[k].push(l);
                                    }
                                    if (syanten_new_next == syanten_org) {
                                        nextgl2options[k].push(l);
                                    }
                                    c[l]--;
                                }
                                c[k]++;
                                // console.log("试打: " + i + ", 进张数: " + restc(nextgloptions[k], c, mt, doras, doraweight) + ", 进张: " + JSON.stringify(nextgloptions[k]));
                                if (restc(nextgloptions[k], c, mt, doras, doraweight) > currentjz) {
                                    nextgl += (restc(nextgloptions[k], c, mt, doras, doraweight) - currentjz) * mt[j] * dora_power;
                                }
                                if (restc(nextgl2options[k], c, mt, doras, doraweight) > currentjz) {
                                    nextgl2 += (restc(nextgl2options[k], c, mt, doras, doraweight) - currentjz) * mt[j] * dora_power;
                                }
                                if (doras[k] > 0) {
                                    dora_power *= Math.pow(doraweight, doras[k]);
                                }
                            }
                        } 
                        c[j]--;
                        mt[j]++;
                    }
                    c[i]++;
                    if (options[i].length) {
                        // console.log("打: " + Helper.indexToString(i) + ", 进张数: " + currentjz + ", 进张: " + JSON.stringify(options[i]) + ", 次轮进张数: " + nextjz.toFixed(2) + ", 次轮改良数: " + nextgl.toFixed(2) + ", 总分加权: " + (currentjz * (nextjz + nextgl * 0.12)).toFixed(2));
                        options[i] = {
                            tileIndex: i,
                            m: currentjz,
                            n: currentjz * (nextjz + nextgl * syanten_org * 0.12),
                            v: options[i],
                            s: syanten_org,
                            d: currentdora
                        };
                    }
                    if (options_b[i].length) {
                        // console.log("打: " + Helper.indexToString(i) + ", 进张数: " + currentjz + ", 进张: " + JSON.stringify(options[i]) + ", 次轮进张数: " + nextjz.toFixed(2) + ", 次轮改良数: " + nextgl.toFixed(2) + ", 总分加权: " + (currentjz * (nextjz + nextgl * 0.12)).toFixed(2));
                        options_b[i] = {
                            tileIndex: i,
                            m: nextgl,
                            n: nextgl + nextgl2 * 0.01,
                            v: options[i],
                            s: syanten_org + 1,
                            d: currentdora
                        };
                    }
                }
            }
            // console.log(options);
            // console.log(options_b);
            const optionsFinal = new Array(1);
            optionsFinal[0] = [];
            optionsFinal[1] = [];
            options.forEach(option => option && option.n ? optionsFinal[0].push(option) : null);
            options_b.forEach(option => option && option.n ? optionsFinal[1].push(option) : null);
            return optionsFinal;
        }
        analyseHandDEF(tilesIn, mountain, defenseInfo, playersCount) {
            const getTilesOfOthersAfterRiichi = (seat, mySeat) => {
                const tiles = [];
                for (let i = 0; i < 4; i++) {
                    if (i === mySeat) continue;
                    if (i === seat) continue;
                    for (const tile of defenseInfo.river[i]) {
                        if (tile.afterRiichi.indexOf(seat) >= 0) {
                            tiles.push(tile);
                        }
                    }
                }
                return tiles;
            };
            const findGenbutsuInRiver = (tileIndex, seat, mySeat) => {
                for (const tile of defenseInfo.river[seat]) {
                    if (tile.tileIndex === tileIndex) return true;
                }
                if (defenseInfo.riichiPlayers.indexOf(seat) === -1) return false;
                for (const tile of getTilesOfOthersAfterRiichi(seat, mySeat)) {
                    if (tile.tileIndex === tileIndex) return true;
                }
                return false;
            }
            const isYakuhai = (tileIndex, seat) => {
                if (!Helper.TILE_GROUP.Z[tileIndex]) return false;
                const n = tileIndex - 27;
                return n >= 4 || n == (seat - defenseInfo.ju + 4) % 4 || n == defenseInfo.chang;
            };
            const hand = tenhou.MPSZ.exextract34(tenhou.MPSZ.expand(tilesIn));
            const playersDangerRate = [];
            const mySeat = defenseInfo.mySeat;
            var riichied = 0;
            for (let seat = 0; seat < 4; seat++) { // look if anyone riichied.
                if (defenseInfo.riichiPlayers.indexOf(seat) >= 0) {
                    riichied++;
                }
            }
            for (let seat = 0; seat < 4; seat++) { // Evaluate danger rates+++++++.
                playersDangerRate[seat] = 0;
                if (seat === mySeat) continue;
                if (defenseInfo.riichiPlayers.indexOf(seat) >= 0) {
                    playersDangerRate[seat] = 1;
                    continue;
                } else {
                    playersDangerRate[seat] += Math.min((defenseInfo.river[seat].length - 6) / 9, 1); // From turn 6, each discard + 1/9
                    if (riichied > 0) {
                        playersDangerRate[seat] /= Math.pow(2, riichied);
                    }
                    playersDangerRate[seat] += defenseInfo.fuuro[seat].length * 0.1; // For each tile of fuuro + 0.1
                }
                playersDangerRate[seat] = Math.min(playersDangerRate[seat], 1);
            }
            const safetyRate = [];
            const TILE_SAFETY_RATE = (view.DesktopMgr.Inst.player_datas.length == 4) ? Helper.TILE_SAFETY_RATE_4 : Helper.TILE_SAFETY_RATE_3;
            hand.forEach((count, tileIndex) => { // Evaluate hand tiles
                if (!count) return;
                safetyRate[tileIndex] = [];
                for (let seat = 0; seat < 4; seat++) {
                    if (seat === mySeat) continue;
                    safetyRate[tileIndex][seat] = 1;
                    if (findGenbutsuInRiver(tileIndex, seat, mySeat)) { // Genbutsu
                        safetyRate[tileIndex][seat] = TILE_SAFETY_RATE.Genbutsu[0];
                        continue;
                    }
                    if (Helper.TILE_GROUP.Z[tileIndex]) {
                        if (mountain[tileIndex] === 0) { // TankiZ
                            safetyRate[tileIndex][seat] = TILE_SAFETY_RATE.TankiZ[0];
                        } else {
                            if (isYakuhai(tileIndex, seat)) { // Yakuhai
                                safetyRate[tileIndex][seat] = TILE_SAFETY_RATE.Yakuhai[0];
                                safetyRate[tileIndex][seat] += TILE_SAFETY_RATE.Yakuhai[1] * (3 - mountain[tileIndex]);
                            } else { // Kyakufuu
                                safetyRate[tileIndex][seat] = TILE_SAFETY_RATE.Kyakufuu[0];
                                safetyRate[tileIndex][seat] += TILE_SAFETY_RATE.Kyakufuu[1] * (3 - mountain[tileIndex]);
                            }
                        }
                        continue;
                    }
                    if (Helper.TILE_GROUP.N19[tileIndex]) { // Suji19
                        const suji = tileIndex + (tileIndex % 9 === 0 ? 3 : -3);
                        const hasSuji = findGenbutsuInRiver(suji, seat, mySeat);
                        if (hasSuji) {
                            safetyRate[tileIndex][seat] = TILE_SAFETY_RATE.Suji19[0];
                            safetyRate[tileIndex][seat] += TILE_SAFETY_RATE.Suji19[1] * (3 - mountain[suji]);
                        } else { // Musuji19
                            safetyRate[tileIndex][seat] = TILE_SAFETY_RATE.Musuji19[0];
                        }
                        continue;
                    }
                    if (Helper.TILE_GROUP.N28[tileIndex]) { // Suji28
                        const suji = tileIndex + (tileIndex % 9 === 1 ? 3 : -3);
                        const hasSuji = findGenbutsuInRiver(suji, seat, mySeat);
                        if (hasSuji) {
                            safetyRate[tileIndex][seat] = TILE_SAFETY_RATE.Suji28[0];
                        } else { // Musuji28
                            safetyRate[tileIndex][seat] = TILE_SAFETY_RATE.Musuji2378[0];
                        }
                        continue;
                    }
                    if (Helper.TILE_GROUP.N456[tileIndex]) { // Nakasuji 456
                        const suji1 = tileIndex - 3;
                        const suji2 = tileIndex + 3;
                        const hasSuji1 = findGenbutsuInRiver(suji1, seat, mySeat);
                        const hasSuji2 = findGenbutsuInRiver(suji2, seat, mySeat);
                        if (hasSuji1 && hasSuji2) {
                            safetyRate[tileIndex][seat] = TILE_SAFETY_RATE.NakaSuji[0];
                        } else if (hasSuji1 || hasSuji2) { // Katasuji
                            safetyRate[tileIndex][seat] = TILE_SAFETY_RATE.Katasuji[0];
                        } else { // Musuji
                            safetyRate[tileIndex][seat] = TILE_SAFETY_RATE.Musuji456[0];
                        }
                        continue;
                    }
                    if (Helper.TILE_GROUP.N37[tileIndex]) { // Suji37
                        const suji = tileIndex + (tileIndex % 9 === 2 ? 3 : -3);
                        const hasSuji = findGenbutsuInRiver(suji, seat, mySeat);
                        if (hasSuji) {
                            safetyRate[tileIndex][seat] = TILE_SAFETY_RATE.Suji37[0];
                        } else { // Musuji37
                            safetyRate[tileIndex][seat] = TILE_SAFETY_RATE.Musuji2378[0];
                        }
                        continue;
                    }
                    safetyRate[tileIndex][seat] = Math.min(safetyRate[tileIndex][seat], 1);
                }
            })
            const options = [];
            safetyRate.forEach((tileRate, tileIndex) => {
                if (!tileRate) return;
                options.push({ tileIndex, rate: tileRate.reduce((a, v, i) => typeof v === "number" ? Math.min(a, (v - 1) * playersDangerRate[i] + 1) : a, 1) })
            })
            options.sort((a, b) => b.rate - a.rate);
            return options;
        }
        discard(tileIn) {
            const mainrole = view.DesktopMgr.Inst.mainrole;
            const handIn = mainrole.hand;
            for (let i = 0; i < handIn.length; i++) {
                const tile = handIn[i];
                if (tile.val.toString() == tileIn) {
                    mainrole._choose_pai = handIn[i]; // setChoosePai
                    mainrole.DoDiscardTile();
                    return;
                }
            }
            if (tileIn.substr(0, 1) == "5") tileIn = tileIn.replace("5", "0");
            for (let i = 0; i < handIn.length; i++) {
                const tile = handIn[i];
                if (tile.val.toString() == tileIn) {
                    mainrole._choose_pai = handIn[i]; // setChoosePai
                    mainrole.DoDiscardTile();
                    return;
                }
            }
        }
        getFromHand(tileIn) {
            const mainrole = view.DesktopMgr.Inst.mainrole;
            const handIn = mainrole.hand;
            const result = [];
            handIn.forEach(tile => tile.val.toString() == tileIn ? result.push(tile) : null);
            if (tileIn.substr(0, 1) == "5") tileIn = tileIn.replace("5", "0");
            handIn.forEach(tile => tile.val.toString() == tileIn ? result.push(tile) : null);
            return result;
        }
        getDora() {
            let doras = "";
            const doranext = (view.DesktopMgr.Inst.player_datas.length == 4) ?
                             [1, 2, 3, 4, 5, 6, 7, 8, 0, 10, 11, 12, 13, 14, 15, 16, 17, 9, 19, 20, 21, 22, 23, 24, 25, 26, 18, 28, 29, 30, 27, 32, 33, 31] :
                             [8, -1, -1, -1, -1, -1, -1, -1, 0, 10, 11, 12, 13, 14, 15, 16, 17, 9, 19, 20, 21, 22, 23, 24, 25, 26, 18, 28, 29, 30, 27, 32, 33, 31];
            for (let i = 0; i < view.DesktopMgr.Inst.dora.length; ++i) {
                let pai = view.DesktopMgr.Inst.dora[i].toString();
                doras += pai;
            }
            const r = tenhou.MPSZ.exextract34(doras);
            const doralist = new Array(34).fill(0);
            for (let i = 0; i < 34; ++i) {
                if (r[i] > 0) {
                    doralist[doranext[i]] = r[i];
                }
            }
            return doralist;
        }
        static indexOfTile(str) {
            const match = str.match(/(\d)([mpsz])/);
            if (match === null) return -1;
            return "mpsz".indexOf(match[2]) * 9 + (+match[1] === 0 ? 5 : +match[1]) - 1;
        }
        static indexToString(i) {
            return (i % 9 + 1) + "mpsz" [parseInt(i / 9)];
        }
        countSubString(subString, string, allowOverlapping) {
            string += "";
            subString += "";
            if (subString.length <= 0) return (string.length + 1);
            var n = 0;
            var pos = 0;
            var step = allowOverlapping ? 1 : subString.length;
            while (true) {
                pos = string.indexOf(subString, pos);
                if (pos >= 0) {
                    ++n;
                    pos += step;
                } else break;
            }
            return n;
        }
    }
    Helper.TILE_SAFETY_RATE_4 = {
        Genbutsu: [1, 0], // 现物
        TankiZ: [0.95, 0], // 单骑字牌
        Suji19: [0.8, 0.05], // 筋牌19 仅单骑 看牌数
        Kyakufuu: [0.75, 0.06], // 客风 看牌数
        Suji28: [0.7, 0], // 筋牌28
        NakaSuji: [0.65, 0], // 两筋456
        Suji37: [0.6, 0], //筋牌37
        Yakuhai: [0.25, 0.5], // 役牌
        Musuji19: [0.4, 0], // 无筋19
        Katasuji: [0.05, 0], // 半筋456
        Musuji2378: [0.01, 0], // 无筋2378
        Musuji456: [0, 0] //无筋456
    }
    Helper.TILE_SAFETY_RATE_3 = {
        Genbutsu: [1, 0], // 现物
        TankiZ: [0.95, 0], // 单骑字牌
        Suji19: [0.8, 0.05], // 筋牌19 仅单骑 看牌数
        Kyakufuu: [0.2, 0.7], // 客风 看牌数
        Suji28: [0.6, 0], // 筋牌28
        NakaSuji: [0.55, 0], // 两筋456
        Suji37: [0.4, 0], //筋牌37
        Yakuhai: [0.1, 0.75], // 役牌
        Musuji19: [0.3, 0], // 无筋19
        Katasuji: [0.2, 0], // 半筋456
        Musuji2378: [0.1, 0], // 无筋2378
        Musuji456: [0.05, 0] //无筋456
    }
    Helper.TILE_GROUP = {
        Z: new Array(34).fill(false).map((v, i) => i >= 27 ? true : false),
        N19: new Array(34).fill(false).map((v, i) => i < 27 && (i % 9 === 0 || i % 9 === 8) ? true : false),
        N28: new Array(34).fill(false).map((v, i) => i < 27 && (i % 9 === 1 || i % 9 === 7) ? true : false),
        N37: new Array(34).fill(false).map((v, i) => i < 27 && (i % 9 === 2 || i % 9 === 6) ? true : false),
        N456: new Array(34).fill(false).map((v, i) => i < 27 && (i % 9 >= 3 && i % 9 <= 5) ? true : false),
    }
    window.Helper = Helper;
    window.helper = new Helper();
    window.AddRoom = class AddRoom {
        constructor(idIn) {
            this.id = idIn;
            this.timer;
        }
        joinRoom(id) {
            app.NetAgent.sendReq2Lobby("Lobby", "joinRoom", {
                room_id: id
            }, (t, i) => {
                if (t || i.error) {
                    // console.log("Failed");
                    return false;
                } else {
                    this.stop();
                    // console.log("Success");
                    uiscript.UI_Lobby.Inst.enable = !1;
                    uiscript.UI_WaitingRoom.Inst.updateData(i.room);
                    uiscript.UIMgr.Inst.ShowWaitingRoom();
                    return true;
                }
            })
        }
        start() {
            this.stop();
            this.timer = setTimeout(() => this.start(), 250);
            return this;
        }
        stop() {
            if (this.timer) clearTimeout(this.timer);
            return this;
        }
    }
    window.getCharacter = () => {
        uiscript.UI_Sushe.characters[2] = {
            charid: 200003,
            exp: 20000,
            extra_emoji: [13],
            is_upgraded: true,
            level: 5,
            skin: 400301
        };
        uiscript.UI_Sushe.characters[3] = {
            charid: 200004,
            exp: 20000,
            extra_emoji: [13],
            is_upgraded: true,
            level: 5,
            skin: 400401
        };
        uiscript.UI_Sushe.characters[4] = {
            charid: 200005,
            exp: 20000,
            extra_emoji: [13],
            is_upgraded: true,
            level: 5,
            skin: 400501
        };
        uiscript.UI_Sushe.characters[5] = {
            charid: 200006,
            exp: 20000,
            extra_emoji: [13],
            is_upgraded: true,
            level: 5,
            skin: 400601
        };
        uiscript.UI_Sushe.characters[6] = {
            charid: 200007,
            exp: 20000,
            extra_emoji: [13],
            is_upgraded: true,
            level: 5,
            skin: 400701
        };
        uiscript.UI_Sushe.characters[7] = {
            charid: 200008,
            exp: 20000,
            extra_emoji: [13],
            is_upgraded: true,
            level: 5,
            skin: 400801
        };
    }
    // Events overRiding
    // Operations : 0 = "none", 1 = "dapai", 2 = "eat", 3 = "peng", 4 = "an_gang", 5 = "ming_gang", 6 = "add_gang", 7 = "liqi", 8 = "zimo", 9 = "rong", 10 = "jiuzhongjiupai", 11 = "babei"
    //# sourceMappingURL=haili.js.map
})();